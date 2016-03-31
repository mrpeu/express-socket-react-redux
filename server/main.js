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
let sockets = [];

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
  return {
    clients: {
      active: [],
      old: []
    },
    messages: [],
    ...state
  };
}

const broadcastState = ( s ) => {
  const state = s || store.getState();
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

  // console.warn( `${JSON.stringify( state, 0, 2 )}` );
  // console.warn(
  //   `Broadcast ${Object.keys( state.clients ).length} clients and ` +
  //   `${state.messages.length} messages.`
  // );

  return state;
};

const saveState = ( state ) => {
  fs.writeFile( 'state.json', JSON.stringify( state, null, 2 ),
    ( err ) => {
      if ( err ) console.error( `saveState: ${err}` );
    }
  );
  return state;
};

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
function validateMessage( stateMessages, socket, client, msg, cbConfirm ) {
  // console.log( `> ${client.name} #${client.cid}: ${JSON.stringify( msg.data, null, 1 )}` );
  if ( msg.data ) {
    // confirm to the emitter the mesage has been treated
    cbConfirm();

    return true;
  } else {
    cbConfirm( { err: 'Message refused' } );
  }

  return false;
}

function addMessage( stateMessages, socket, client, msg ) {
  // socket.emit( 'chat-message', msg );
  socket.broadcast.emit( 'chat-message', { color: client.color, name: client.name, ...msg } );

  return [
    ...stateMessages,
    { color: client.color, name: client.name, ...msg }
  ];
}

function refuseMessage( stateMessages, socket, client, msg ) {
  return stateMessages;
}


// Client management
function onClientDisconnection( state, client ) {
  sockets = sockets.filter( f => f.client.id === client.sid );
  return {
    ...state,
    clients: state.clients.filter( c => c.sid !== client.sid ),
    clientsOld: [ client, ...state.clientsOld ]
  };
}

function markClientAlive( stateClients, client ) {
  // console.log( chalk.blue( `  ${client.name} time to live:` +
  //   ` ${( client.ts + USER_TIMEOUT - Date.now() ) / 1000}s`
  // ) );
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

  // console.log( `  Client ${client.ts ? 're' : ''}connected: ` +
  //   `${client.name} #${client.cid} #${client.sid}` );
  // console.warn( `Client connected: ${JSON.stringify( client, 0, 1 )}` );

  const existingSocket = sockets.findIndex( s => s.client.id === client.sid );

  if ( existingSocket ) {
    sockets[ existingSocket ] = socket;
  } else {
    sockets = [ ...sockets, socket ];
  }

  socket.on( 'chat-message', ( msg, cb ) => {
    // console.warn( `chat-message: ${JSON.stringify(msg)}` );
    store.dispatch( Actions.receiveMessage( socket, client, msg, cb ) );
  } );

  socket.on( 'disconnect', () => {
    console.log( `  Client disconnected: ${client.name} #${client.cid} #${client.sid}` );
    store.dispatch( Actions.disconnectClient( socket, client ) );
  } );

  client = {
    name: NAMES[ ~~( ( NAMES.length - 1 ) * Math.random() ) ],
    color: COLORS[ ~~( ( COLORS.length - 1 ) * Math.random() ) ],
    cid: socket.client.id, // client id
    ...client,
    ts: Date.now(),
    sid: socket.client.id // session id
  };

  const newClientsActive = [
    ...stateClients.active.filter( c => c.cid !== client.cid ),
    client
  ];

  socket.emit( 'welcome', {
    client,
    clients: newClientsActive
  } );

  // console.warn( `<< connectClient end ${JSON.stringify( client )}` );

  return {
    active: newClientsActive,
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
  clients: ( stateClients = [], action ) => {
    if ( action.client ) {
      // console.warn('a',stateClients.active.map(c=>c.ts/1000).join());
      stateClients = markClientAlive( stateClients, action.client );
    }

    switch ( action.type ) {

      case Actions.Types.connectClient:
        if ( authenticateClient( stateClients, action.socket, action.client ) ) {
          return connectClient( stateClients, action.socket, action.client );
        } else {
          return refuseClient( stateClients, action.socket, action.client );
        }

      case Actions.Types.disconnectClient:
        return disconnectClient( stateClients, action.socket, action.client );

      case Actions.Types.cleanState:
        return stateClients;

      default:
        // console.warn( `  Unknown action type '${action.type}'`);
        return stateClients;
    }
  },
  messages: ( stateMessages = [], action ) => {
    switch ( action.type ) {

      case Actions.Types.receiveMessage:
        // console.warn( chalk.yellow( `${Object.keys( action ).join(', ')}` ) );
        // console.warn( chalk.yellow( `${JSON.stringify( action, 0, 1 )}` ) );
        if ( validateMessage( stateMessages,
              action.socket, action.client, action.msg, action.cb )
            ) {
          return addMessage( stateMessages, action.socket, action.client, action.msg );
        } else {
          return refuseMessage( stateMessages, action.socket, action.client, action.msg );
        }
      default:
        return stateMessages;
    }
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

store.subscribe( _.throttle( () => {
  const state = store.getState();
//   console.log( chalk.blue( `saveState: ${JSON.stringify( state, 0, 1 )}` ) );
  broadcastState( saveState( cleanState( state ) ) );
}, 5000 ) );

app.get( '/', ( req, res ) => {
  res.sendFile( path.resolve( 'client/index.html' ) );
} );
app.use( '/static', express.static( path.resolve( 'client' ) ) );
app.use( '/js', express.static( path.resolve( 'build/client' ) ) );

// Start server
http.listen( 3000, () => {
  console.log( 'listening on *:3000' );
} );
