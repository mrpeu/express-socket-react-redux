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
let store = {};
let isStoreDirty = false;

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
    clients: [],
    chat: {
      messages: []
    },
    ...state
  };
}

function broadcastState() {
  const state = store.getState();

  io.of( '' ).emit( 'app-state', {
    chat: state.chat,
    clients: state.clients.map( c => _.omit( c, 'socket' ) )
  } );

  isStoreDirty = false;

  console.log( chalk.gray( 'broadcast' ) );

  // console.warn( `${JSON.stringify( state )}` );
  // console.warn(
  //   `Broadcast ${Object.keys( state.clients ).length} clients and ` +
  //   `${state.chat.messages.length} messages.`
  // );

  return state;
}

function saveState( state ) {
  fs.writeFile( 'state.json', JSON.stringify( {
    ...state,
    clients: state.clients.map( c => _.omit( c, 'socket' ) )
  }, null, 2 ),
    ( err ) => {
      if ( err ) console.error( `saveState: ${err}` );
    }
  );
  return state;
}

function cleanState( state ) {
  const now = Date.now();

  return {
    ...state,
    chat: {
      ...state.chat
    },
    clients: state.clients.filter( c => {
      if ( ( now - c.ts ) > USER_TIMEOUT ) {
        console.log( `Client ${c.name} is no longer active.` );
        return false;
      }
      return true;
    } )
  };
}


// Message management
function validateMessage( stateChat, socket, client, req, cbConfirm ) {
  if ( req.data && req.data !== 'fuck' ) {
    console.log( `> ${client.name} #${client.cid}: ${JSON.stringify( req, null, 1 )}` );
    // confirm to the emitter the mesage has been treated
    cbConfirm( req );
    return true;
  } else {
    cbConfirm( { ...req, err: 'Message refused' } );
    return false;
  }
}

function addMessage( stateChat, socket, client, data ) {
  const msg = {
    color: client.color,
    name: client.name,
    role: client.role,
    cid: client.cid,
    t: Date.now(),
    ...data
  };

  // socket.broadcast.emit( 'chat-message', msg );

  isStoreDirty = true;

  return {
    ...stateChat,
    messages: [
      ...stateChat.messages.slice( -5 ),
      msg
    ]
  };
}

function refuseMessage( stateChat, socket, client, data ) {
  return stateChat;
}


// Client management
function onClientDisconnection( state, client ) {
  isStoreDirty = true;

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

  return stateClients.map( c => {
    if ( c.cid === client.cid ) {
      return {
        ...c,
        ts: Date.now()
      };
    }
    return c;
  } );
}

function disconnectClient( state, socket, client ) {
  isStoreDirty = true;

  return state.filter( c => c.cid !== client.cid );
}

// After authentication fail
function refuseClient( state, socket, client, authResponse ) {
  socket.emit(
    'notwelcome',
    { err: 'connection refused!' }
  );
  return state;
}

// After authentication success
function connectClient( stateClients, socket, client, authResponse ) {
  // console.log( `>> connectClient start ${JSON.stringify( client, 0, 1 )}` );

  // console.log( `  Client ${client.ts ? 're' : ''}connected: ` +
  //   `${client.name} #${client.cid} #${client.sid}` );

  if ( authResponse !== true ) {
    console.warn(
      chalk.magenta(
        `  ${authResponse}: ${client.name} cid: ${client.cid}`
      )
    );
  }

  client = {
    name: socket.client.hostname
      || NAMES[ ~~( ( NAMES.length - 1 ) * Math.random() ) ],
    color: COLORS[ ~~( ( COLORS.length - 1 ) * Math.random() ) ],
    cid: socket.client.hostname + socket.client.id, // client id
    ...client,
    ts: Date.now(),
    socket,
    sid: socket.client.id // session id
  };

  console.log(
    `  Client connected: name:  ${client.name}\n` +
    `                    color: ${client.color}\n` +
    `                    cid:   ${client.cid}\n` +
    `                    sid:   ${client.sid}`
  );
  // console.log( `  Client connected: ${JSON.stringify( client, 0, 1 )}` );

  socket.on( 'chat-message', ( data, cb ) => {
    // console.warn( `chat-message: ${JSON.stringify(data)}` );
    store.dispatch( Actions.receiveMessage( socket, client, data, cb ) );
  } );

  socket.on( 'client-status', ( data, cb ) => {
    // console.warn( chalk.yellow( `client-status: ${JSON.stringify( data )}` ) );
    store.dispatch( Actions.receiveRunStatus( socket, client, data, cb ) );
  } );

  socket.on( 'disconnect', () => {
    console.log( `  Client disconnected: ${client.name} #${client.cid} #${client.sid}` );
    store.dispatch( Actions.disconnectClient( socket, client ) );
  } );

  socket.on( 'startClientAction', ( action, cb ) => {
    const target = stateClients.find( c => c.cid === action.cid );
    if ( !target ) {
      console.error( 'TARGET MISSING cid:%s',
        action.cid, stateClients.map( c => c.cid )
      );
    }
    // else console.warn( 'TARGET FOUND', target.name );

    if ( !target.socket ) {
      console.error( 'TARGETSOCKET MISSING sid:%s', target.sid, target.socket );
    } else {
      store.dispatch( Actions.startClientAction(
        target.socket,
        action,
        cb
      ) );
    }
  } );

  socket.emit( 'welcome', { client: _.omit( client, 'socket' ) } );

  broadcastState();

  // console.warn( `<< connectClient end ${JSON.stringify( client )}` );

  isStoreDirty = true;

  return [
    ...stateClients.filter( c => c.cid !== client.cid ),
    client
  ];
}

function authenticateClient( stateClients, socket, client ) {
  if ( !client ) {
    console.log( `  Authentication of ${client} failed.` );
    return false;
  }

  console.log( `  Authentication of ${client.name} #${client.cid}...` );
  // console.log( `  Authentication of ${JSON.stringify( client )}...` );

  // check if already in state.clients
  if ( stateClients.some( c => c.cid === client.cid ) ) {
    // console.warn( chalk.magenta( `  ACTIVE: ${client.name} #${client.cid}` ) );
    return 'ACTIVE';
  } else {
    return 'NEW';
  }
}

function updateClientRuns( clients, { socket, client, data } ) {
  // console.warn( 'updateClientRuns:', data );

  socket.broadcast.emit( 'client-status', {
    cid: client.cid,
    status: {
      ...client.status,
      ...data
    }
  } );

  return clients.map( c => {
    if ( c.cid !== client.cid ) {
      return c;
    } else {
      return {
        ...client,
        status: {
          ...client.status,
          ...data
        }
      };
    }
  } );
}

function emitStartClientAction( { socket, clientAction, cb } ) {
  console.warn(
    'emitStartClientAction:', chalk.yellow( JSON.stringify( clientAction.data ) ),
    'to cid:', chalk.yellow( JSON.stringify( clientAction ) )
  );
  console.log( `${store.getState().clients.find( c => c.cid === clientAction.cid )}` );
  socket.emit( 'start', clientAction.data, cb );
}

// Store:
store = createStore( combineReducers( {
  clients: ( stateClients = {}, action ) => {
    // console.warn( chalk.cyan( `REDUX: ${JSON.stringify( action.type )}` ) );

    if ( action.client ) {
      // console.warn('a',stateClients.map(c=>c.ts/1000).join());
      stateClients = markClientAlive( stateClients, action.client );
    }

    switch ( action.type ) {

      case Actions.Types.connectClient: {
        const authResponse = authenticateClient( stateClients, action.socket, action.client );
        if ( authResponse !== false ) {
          return connectClient( stateClients, action.socket, action.client, authResponse );
        } else {
          return refuseClient( stateClients, action.socket, action.client, authResponse );
        }
      }

      case Actions.Types.disconnectClient:
        return disconnectClient( stateClients, action.socket, action.client );

      case Actions.Types.cleanState:
        console.warn( 'Actions.Types.cleanState: Not implemented!' );
        return stateClients;

      case Actions.Types.receiveRunStatus:
        return updateClientRuns( stateClients, action );

      case Actions.Types.startClientAction:
// console.warn( chalk.yellow(
//   stateClients.find( c => c.cid === action.cid )
//   .sid
// ) );
        emitStartClientAction( action );
        return stateClients;

      default:
        // console.warn( `  Unknown action type '${action.type}'`);
        return stateClients;
    }
  },
  chat: ( stateChat = {}, action ) => {
    switch ( action.type ) {

      case Actions.Types.receiveMessage:
        // console.warn( chalk.yellow( `${Object.keys( action ).join(', ')}` ) );
        // console.warn( chalk.yellow( `${JSON.stringify( action, 0, 1 )}` ) );
        if ( validateMessage( stateChat,
              action.socket, action.client, action.data, action.cb )
            ) {
          return addMessage( stateChat, action.socket, action.client, action.data );
        } else {
          return refuseMessage( stateChat, action.socket, action.client, action.data );
        }
      default:
        return stateChat;
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

store.subscribe(
  _.throttle(
    () => {
      if ( isStoreDirty ) {
        broadcastState( saveState( cleanState( store.getState() ) ) );
      }
    }
  , 200 )
);


app.get( '/', ( req, res ) => {
  res.sendFile( path.resolve( 'client/index.html' ) );
} );
app.use( '/static', express.static( path.resolve( 'client' ) ) );
app.use( '/js', express.static( path.resolve( 'build/client' ) ) );

// Start server
http.listen( 3000, () => {
  console.log( 'listening on *:3000' );
} );
