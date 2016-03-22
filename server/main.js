import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import style from 'ansi-styles';
import _ from 'lodash';
import express from 'express';
import _http from 'http';
import _io from 'socket.io';
import { createStore } from 'redux';
import * as Actions from './actions.js';

process.env.DEBUG = '';

const app = express( );
const http = _http.Server( app );
const io = _io( http );
const socketsByClientId = {};

let store = {};

const USER_TIMEOUT = 60 * 1000;

const NAMES = [ 'Luna', 'Oliver', 'Alison', 'Desmond', 'Ava', 'Lincoln',
  'Henry', 'Clémentine', 'Lucas', 'Ella',
  'Akira', 'Amaterasu', 'Atsuko', 'Arisu', 'Ayaka', 'Jung', 'Iseul', 'Haneul' ];
const COLORS = [ '#aaa', '#e44', '#4e4', '#44e', '#dcd7d2', '#2b2b2b', '#2a5fe3',
  '#d94835', '#30a28f', '#7a7a7a', '#049451', '#24364b', '#b3b3b3', '#84454a',
  '#c38f3d', '#758b9d', '#ad8989', '#2ea9c3' ];

// State file
const loadState = ( ) => {
  let state = {};
  try {
    const data = fs.readFileSync( 'state.json' );
    state = JSON.parse( data );
  } catch ( e ) {
    console.error( JSON.stringify( e, 0, 1 ) );
    state = {
      clients: [ ],
      clientsOld: [ ],
    };
  }
  return {
    clients: [ ],
    clientsOld: [ ],
    messages: [ ],
    ...state
  };
};

const saveState = ( state ) => {
  // fs.writeFile( 'state.json', JSON.stringify( state, null, 2 ),
  //   ( err ) => {
  //     if ( err )
  //       console.error( `saveState: ${err}` );
  //   }
  // );
  console.error( 'saveState: Not implemented yet!' );
};

const broadcastState = ( state ) => {
  console.log( `Broadcast state.clients: [ ${
  state.clients.reduce( ( s, c ) =>
      `${s}${style.bgColor.ansi.hex( c.color )}_${style.bgColor.close}${c.name}` +
      `( ${( ( ( c.ts + USER_TIMEOUT ) - Date.now( ) ) / 1000 ).toFixed( 2 )}s ), `
    , '' ).replace( /, $/, '' )
  } ]` );
  io.of( '' ).emit( 'state.clients', state.clients );

  return state;
};

const cleanState = ( state ) => {
  const now = Date.now( );

  const clients = [ ];
  const goneClients = [ ];

  state.clients.forEach( c => {
    if ( ( now - c.ts ) > USER_TIMEOUT ) {
      goneClients.push( c );
      console.log( `Client ${c.name} is no longer active.` );
    } else {
      clients.push( c );
    }
  } );

  // merge
  const clientsOld = goneClients.concat( state.clientsOld.filter( old =>
    ( now - old.ts ) > USER_TIMEOUT * 2 &&
    goneClients.findIndex( gone => old.cid === gone.cid ) < 0
  ) );

  let newState = {
    ...state,
    clients,
    clientsOld
  };

  // if there has been changes
  if ( goneClients.length > 0 )
    newState = broadcastState( newState );

  return newState;
};


// Message management
const receiveMessage = ( state, msg ) => ( {
  ...state,
  messages: [ ...state.messages, msg ]
} );

const addMessage = ( ) => arguments;


// Client management
const onClientDisconnection = ( state, client ) => {
  delete socketsByClientId[ client.sid ];
  return {
    ...state,
    clients: state.clients.filter( c => c.sid !== client.sid ),
    clientsOld: [ client, ...state.clientsOld ]
  };
};

const markClientAlive = ( state, data ) => {
  const client = data.client;
  // console.log( chalk.blue( `${client.name} time to live:` +
  //   ` ${( client.ts + USER_TIMEOUT - Date.now( ) ) / 1000}s`
  // ) );

  // const nState = {
  return {
    ...state,
    clients: state.clients.map(
      c => c.cid === client.cid
      ? {
        ...c,
        ts: Date.now( )
      }
      : c
    )
  };

  // const nClient = nState.clients.find( c => c.cid === client.cid );
  // console.log( chalk.blue( `${nClient.name} time to live:` +
  //   ` ${( nClient.ts + USER_TIMEOUT - Date.now( ) ) / 1000}s`
  // ) );

  // return nState;
};

// After authentication fail
const refuseClient = ( state, data ) => {
  data.socket.emit(
    'notwelcome',
    { err: `${data.msg || 'client connection refused!'}` }
  );
  return state;
};

// After authentication success
const connectClient = ( state, data ) => {
  // console.log( `>> connectClient start ${JSON.stringify( store.getState( ), 0, 1 )}` );
  const client = data.client;
  const socket = data.socket;
  socketsByClientId[ client.sid ] = socket;

  if ( data.isNew ) {
    socket.on( 'chat-message', ( msg, callback ) => {
      markClientAlive( state, { client } );

      if ( !msg.data ) return;

      console.log( `> ${client.name} #${client.cid}: ${JSON.stringify( msg.data, null, 1 )}` );
      state = receiveMessage( state, msg );

      // confirm to the emitter the mesage has been treated
      callback( );
      // socket.emit( 'chat-message', msg );
      socket.broadcast.emit( 'chat-message', msg );
    } );

    socket.on( 'disconnect', ( ) => {
      console.log( `Client disconnected: ${client.name} #${client.cid} #${client.sid}` );
      // console.log( `< a client disconnected: ${JSON.stringify( client,0,1 )}` );
      state = onClientDisconnection( state, client );

      state = broadcastState( state );
    } );
  }

  console.log( `Client connected: ${client.name} #${client.cid} #${client.sid}` );
  // console.log( `> a client connected: ${JSON.stringify( client, 0, 1 )}` );

  socket.emit( 'welcome', { client } );

  // console.log( `<< connectClient end ${JSON.stringify( {
  //   ...state,
  //   clients: [ ...state.clients, client ]
  // }, 0, 1 )}` );

  return broadcastState( {
    ...state,
    clients: [
      ...state.clients.map( c => c.cid !== client.cid ),
      client
    ]
  } );
};

const authenticateClient = ( state, data ) => {
  const dataClient = data.client;
  console.log( `Authentication of ${dataClient.name} #${dataClient.cid}...` );
  // console.log( chalk.magenta( `${JSON.stringify( store.getState( ), 0, 1 )}` ) );

  let isNew = false;

  // check if already in state.clients
  let client = state.clients.find( c => c.cid === dataClient.cid );
  if ( client ) console.warn( chalk.magenta( `  ACTIVE: ${client.name} #${client.cid}` ) );

  // check if already in state.clientsOld
  if ( !client ) {
    client = state.clientsOld.find( c => c.cid === dataClient.cid );
    if ( client ) console.warn( chalk.magenta( `  OLD: ${client.name} #${client.cid}` ) );
  }

  if ( !client ) {
    isNew = true;
    // create a new client if new
    client = {
      name: NAMES[ ~~( ( NAMES.length - 1 ) * Math.random( ) ) ],
      color: COLORS[ ~~( ( COLORS.length - 1 ) * Math.random( ) ) ],
      chat: false,
      ...dataClient,
      ts: Date.now( ),
      sid: dataClient.sid, // session id
      cid: dataClient.cid || dataClient.sid // client id
    };
    if ( client ) console.warn( chalk.magenta( `  NEW: ${client.name} #${client.cid}` ) );
  }

  if ( client ) {
    // update info if found in store
    return connectClient( state, {
      isNew,
      socket: data.socket,
      client: {
        ...( _.pick( client, 'cid,name,color,address,chat,runner'.split( ',' ) ) ),
        sid: dataClient.sid,
        address: dataClient.address,
        ts: Date.now( )
      }
    } );
  } // else

  // Couldn't find nor create a new client?!
  return refuseClient( state, {
    client,
    socket: data.socket
  } );

  // console.log( `<< authenticationClient ${JSON.stringify( store.getState( ), 0, 1 )}` );
};


// Reducer:
const reducerMap = {
  [ Actions.Types.authenticateClient ]: authenticateClient,
  [ Actions.Types.connectClient ]: connectClient,
  [ Actions.Types.refuseClient ]: refuseClient,
  [ Actions.Types.markClientAlive ]: markClientAlive,
  [ Actions.Types.receiveMessage ]: receiveMessage,
  [ Actions.Types.addMessage ]: addMessage,
  [ Actions.Types.cleanState ]: cleanState
};
const reducer = ( state = loadState( ), action ) => {
  const fn = reducerMap[ action.type ];
  console.log( chalk.red( `*${action.type}*` ) );
  // console.log( chalk.blue( `${JSON.stringify( state, 0, 1 )}` ) );
  return fn ? fn( state, action ) : state;

  // switch ( action.type ) {
  //   case Actions.Types.authenticateClient:
  //     return authenticateClient( state, action );
  //   case Actions.Types.connectClient:
  //     return connectClient( state, action );
  //   case Actions.Types.markClientAlive:
  //     return markClientAlive( state, action );
  //   default:
  //     return state;
  // }
};

// Store:
store = createStore( reducer );


io.on( 'connection', ( socket ) => {
  // console.warn( chalk.green( JSON.stringify( socket.request.connection.remoteAddress ) ) );
  //    ${JSON.stringify( 'data' )}` ) );

  socket.on( 'authentication', data => {
    // console.warn( chalk.blue( `socket.on( 'authentication', ${JSON.stringify( data )} )` ) );
    store.dispatch( Actions.authenticateClient( socket, {
      ...data.client,
      sid: socket.client.id,
      address: socket.handshake.address
    } ) );
  } );
} );

// store.subscribe( ( ) => {
//   const state = store.getState( );
// //   console.log( chalk.blue( `saveState: ${JSON.stringify( state, 0, 1 )}` ) );
//   saveState( state );
// } );

app.get( '/', ( req, res ) => {
  res.sendFile( path.resolve( 'client/index.html' ) );
} );
app.use( '/static', express.static( path.resolve( 'client' ) ) );
app.use( '/js', express.static( path.resolve( 'build/client' ) ) );

// Start server
http.listen( 3000, ( ) => {
  console.log( 'listening on *:3000' );

  // setInterval( ( ) => {
  //   store.dispatch( Actions.cleanState( store.getState( ) ) );
  // }, 10000 );
} );
