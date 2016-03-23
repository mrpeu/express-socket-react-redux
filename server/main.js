import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import style from 'ansi-styles';
import _ from 'lodash';
import express from 'express';
import _http from 'http';
import _io from 'socket.io';
import { combineReducers, createStore } from 'redux';
import * as Actions from './actions.js';

process.env.DEBUG = '';

const app = express();
const http = _http.Server( app );
const io = _io( http );
const socketsByClientId = {};

const initialState = {
  clients: {
    active: [],
    old: []
  },
  messages: []
};
let store = {};

const USER_TIMEOUT = 60 * 1000;

const NAMES = [ 'Luna', 'Oliver', 'Alison', 'Desmond', 'Ava', 'Lincoln',
  'Henry', 'Clémentine', 'Lucas', 'Ella',
  'Akira', 'Amaterasu', 'Atsuko', 'Arisu', 'Ayaka', 'Jung', 'Iseul', 'Haneul' ];
const COLORS = [ '#aaa', '#e44', '#4e4', '#44e', '#dcd7d2', '#2b2b2b', '#2a5fe3',
  '#d94835', '#30a28f', '#7a7a7a', '#049451', '#24364b', '#b3b3b3', '#84454a',
  '#c38f3d', '#758b9d', '#ad8989', '#2ea9c3' ];

console.log( '------------------' );

// State file
function loadState() {
  let state = {};
  try {
    const data = fs.readFileSync( 'state.json' );
    state = JSON.parse( data );
  } catch ( err ) {
    console.error( chalk.red( `loadState error: ${err}` ) );
  }
  return { ...initialState, ...state };
}

const saveState = _.throttle( ( state ) => {
  // fs.writeFile( 'state.json', JSON.stringify( state, null, 2 ),
  //   ( err ) => {
  //     if ( err )
  //       console.error( `saveState: ${err}` );
  //   }
  // );
  // console.warn( 'saveState: Disabled.' );
}, 10000);

const broadcastState =
  // _.throttle(
    () => {
      const state = store.getState();
      // console.log( chalk.blue( `Broadcast state: [ ${
      //   state.clients.active.reduce( ( s, c ) =>
      //     `${s}${style.bgColor.ansi.hex( c.color )}_${style.bgColor.close}${c.name}` +
      //     `( ${( ( ( c.ts + USER_TIMEOUT ) - Date.now() ) / 1000 ).toFixed( 2 )}s ), `
      //   , '' ).replace( /, $/, '' )
      // } ]` ) );
      io.of( '' ).emit( 'state', {
        messages: state.messages,
        clients: state.clients.active
      } );

      console.warn( `${JSON.stringify( state, 0, 1 )}` );

      return state;
    }
  // , 10000)
;

function cleanState( stateClients ) {
  const now = Date.now();

  const clients = [ ];
  const goneClients = [ ];

  stateClients.clients.active.forEach( c => {
    if ( ( now - c.ts ) > USER_TIMEOUT ) {
      goneClients.push( c );
      console.log( `Client ${c.name} is no longer active.` );
    } else {
      clients.push( c );
    }
  } );

  // merge
  const clientsOld = goneClients.concat( stateClients.clients.old.filter( old =>
    ( now - old.ts ) > USER_TIMEOUT * 2 &&
    goneClients.findIndex( gone => old.cid === gone.cid ) < 0
  ) );

  // // if there has been changes
  // if ( goneClients.length > 0 )
  //   newState = broadcastState( newState );

  return {
    ...stateClients,
    clients: {
      active: clients,
      old: clientsOld
    }
  };
}


// Message management
function receiveMessage( stateMessages, socket, client, msg, cbConfirm ) {
  // console.log( `> ${client.name} #${client.cid}: ${JSON.stringify( msg.data, null, 1 )}` );
  if ( !msg.data ) return stateMessages;


  // confirm to the emitter the mesage has been treated
  cbConfirm();
  // socket.emit( 'chat-message', msg );
  socket.broadcast.emit( 'chat-message', msg );

  return [
    ...stateMessages,
    msg
  ];
}

const addMessage = () => arguments;


// Client management
const onClientDisconnection = ( state, client ) => {
  delete socketsByClientId[ client.sid ];
  return {
    ...state,
    clients: state.clients.filter( c => c.sid !== client.sid ),
    clientsOld: [ client, ...state.clientsOld ]
  };
};

function markClientAlive( stateClients, client ) {
  console.log( chalk.blue( `  ${client.name} time to live:` +
    ` ${( client.ts + USER_TIMEOUT - Date.now() ) / 1000}s`
  ) );
  client.ts = Date.now();
// console.warn(chalk.red(client.ts+' > '+Date.now()));
  // const nState = {
  return {
    active: stateClients.active.map( c => {
      if ( c.cid === client.cid ) {
        return {
          ...c,
          ts: Date.now()
        };
      }
      return c;
    } ),
    old: stateClients.old
  };

  // const nClient = nState.clients.find( c => c.cid === client.cid );
  // console.log( chalk.blue( `${nClient.name} time to live:` +
  //   ` ${( nClient.ts + USER_TIMEOUT - Date.now() ) / 1000}s`
  // ) );

  // return nState;
}
function disconnectClient( state, socket, client ) {
  return {
    active: state.active.filter( c => c.cid !== client.cid ),
    old: state.old.filter( c => c.cid !== client.cid )
  };
}

// After authentication fail
function refuseClient( state, socket, client ) {
  socket.emit(
    'notwelcome',
    { err: 'connection refused!' }
  );
  return state;
}

// After authentication success
function connectClient( stateClients, socket, client ) {
  // console.log( `>> connectClient start ${JSON.stringify( client, 0, 1 )}` );

  console.log( `  Client ${client.ts ? 're' : ''}connected: ` +
    `${client.name} #${client.cid} #${client.sid}` );
  // console.log( `Client connected: ${JSON.stringify( client, 0, 1 )}` );

  if ( !socketsByClientId[ client.sid ] ) {
    socketsByClientId[ client.sid ] = socket;
    socket.on( 'chat-message', ( msg, cb ) => {
      // console.warn( `chat-message: ${JSON.stringify(msg)}` );
      store.dispatch( Actions.receiveMessage( socket, client, msg, cb ) );
    } );

    socket.on( 'disconnect', () => {
      console.log( `  Client disconnected: ${client.name} #${client.cid} #${client.sid}` );
      // console.log( `< a client disconnected: ${JSON.stringify( client,0,1 )}` );
      store.dispatch( Actions.disconnectClient( socket, client ) );
    } );
  }

  client = {
    name: NAMES[ ~~( ( NAMES.length - 1 ) * Math.random() ) ],
    color: COLORS[ ~~( ( COLORS.length - 1 ) * Math.random() ) ],
    ...client,
    ts: Date.now(),
    address: socket.handshake.address,
    sid: socket.client.id, // session id
    cid: socket.client.id // client id
  };

  socket.emit( 'welcome', { client, clients: stateClients.active } );

  // console.log( `<< connectClient end ${JSON.stringify( client )}` );

  return {
    active: [
      ...stateClients.active.map( c => c.cid !== client.cid ),
      client
    ],
    old: [
      ...stateClients.old.map( c => c.cid !== client.cid )
    ]
  };
}

const authenticateClient = ( stateClients, socket, client ) => {
  console.log( `  Authentication of ${client.name} #${client.cid}...` );

  // check if already in state.clients
  if ( stateClients.active.some( c => c.cid === client.cid ) ) {
    console.warn( chalk.magenta( `  ACTIVE: ${client.name} #${client.cid}` ) );
    return 'ACTIVE';
  }

  // check if already in state.clientsOld
  if ( stateClients.old.some( c => c.cid === client.cid ) ) {
    console.warn( chalk.magenta( `  OLD: ${client.name} #${client.cid}` ) );
    return 'OLD';
  }

  // authentication failure:
  // return false;

  return true;
};

// Store:
store = createStore( combineReducers( {
  first: ( stateRoot='', action ) => {
    console.log( chalk.green( `*clients${action.type}*` ) );
    return stateRoot;
  },
  clients: ( stateClients = initialState.clients, action ) => {
    if ( action.client ){
      // console.warn('a',stateClients.active.map(c=>c.ts/1000).join());
      stateClients = markClientAlive( stateClients, action.client );
      integrityTest(stateClients);
    }

    switch ( action.type ) {

      case Actions.Types.connectClient:
        if ( authenticateClient( stateClients, action.socket, action.client ) ) {
          stateClients = connectClient( stateClients, action.socket, action.client );
          integrityTest(stateClients);
          return stateClients;
        }
        return refuseClient( stateClients, action.socket, action.client );

      case Actions.Types.disconnectClient:
        stateClients = disconnectClient( stateClients, action.socket, action.client );
        integrityTest(stateClients);
        return stateClients;

      case Actions.Types.cleanState:
        return stateClients;

      default:
        // console.warn( `  Unknown action type '${action.type}'`);
        return stateClients;
    }

    // integrity tests
    function integrityTest(stateClients) {
      // console.warn(chalk.yellow(JSON.stringify(stateClients.active)));
      if ( stateClients.active.constructor !== Array )
        throw new Error( `stateClients.active should be an Array "${JSON.stringify(stateClients.active)}"` );

      if ( stateClients.active.length > 0 ){
        const ks = 'cid,sid,name,color,ts'.split(',');
        stateClients.active.every( c => {
          const oks = Object.keys(c);
          return ks.every( k => {
            if( oks.indexOf(k) < 0 ){
              throw new Error( `stateClients integrity fail! ${chalk.red( JSON.stringify( c, 0, 1 ) )}` +
               ` does not contain key "${k}"` )
            }
          } );
        } );
      }
    }
  },
  messages: ( stateMessages = initialState.messages, action ) => {
    switch ( action.type ) {

      case Actions.Types.receiveMessage:
  // console.warn( chalk.yellow( `${Object.keys( action ).join(', ')}` ) );
// console.warn( chalk.yellow( `${JSON.stringify( action, 0, 1 )}` ) );
        return receiveMessage( stateMessages, action.socket, action.client, action.msg, action.cb );

      default:
        return stateMessages;
    }
  },
  last: ( stateRoot='', action ) => {
    console.log( chalk.green( `*/clients${action.type}*` ) );
    if(store.getState) broadcastState();
    return stateRoot;
  }
} ), loadState() );


io.on( 'connection', ( socket ) => {
  // console.warn( chalk.green( JSON.stringify( socket.request.connection.remoteAddress ) ) );
  //    ${JSON.stringify( 'data' )}` ) );

  socket.on( 'authentication', data => {
    // console.warn( chalk.blue( `socket.on( 'authentication', ${JSON.stringify( data )} )` ) );
    store.dispatch( Actions.connectClient( socket, data.client ) );
  } );
} );

store.subscribe( () => {
  const state = store.getState();
//   console.log( chalk.blue( `saveState: ${JSON.stringify( state, 0, 1 )}` ) );
  saveState( state );
} );

app.get( '/', ( req, res ) => {
  res.sendFile( path.resolve( 'client/index.html' ) );
} );
app.use( '/static', express.static( path.resolve( 'client' ) ) );
app.use( '/js', express.static( path.resolve( 'build/client' ) ) );

// Start server
http.listen( 3000, () => {
  console.log( 'listening on *:3000' );

  setInterval( () => {
    broadcastState();
    // store.dispatch( Actions.cleanState() );
  }, 10000 );
} );
