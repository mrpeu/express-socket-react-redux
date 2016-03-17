"use strict";

const fs = require( 'fs' );
const chalk = require( 'chalk' );
const style = require( 'ansi-styles' );
const path = require( 'path' );
const express = require( 'express' );
const app = express();
const http = require( 'http' ).Server( app );
const io = require( 'socket.io' )( http );

process.env[ 'DEBUG' ] = '*'


const USER_TIMEOUT = 60 * 1000;

const NAMES = [ 'Henry', 'Luna', 'Oliver', 'Alison', 'Desmond', 'Ava', 'Lincoln', 'Clémentine', 'Lucas', 'Ella', 'Akira', 'Amaterasu', 'Atsuko', 'Arisu', 'Ayaka', 'Jung', 'Iseul', 'Haneul' ];
const COLORS = [ '#aaa', '#e44', '#4e4', '#44e', '#dcd7d2', '#2b2b2b', '#2a5fe3', '#d94835', '#30a28f', '#7a7a7a', '#049451', '#24364b', '#b3b3b3', '#84454a', '#c38f3d', '#758b9d', '#ad8989', '#2ea9c3' ];


app.get( '/', function( req, res ) {
  res.sendFile( path.resolve( 'client/index.html' ) );
} );
app.use( '/static', express.static( path.resolve( 'client' ) ) );
app.use( '/js', express.static( path.resolve( 'build/client' ) ) );


var state = null;

function loadState( cb ) {
  fs.readFile( 'state.json', ( err, data ) => {
    if ( err ) {
      console.error( `loadState: ${err}` );
      return cb( err, {
        clients: [],
        clientsOld: []
      } );
    } else {
      return cb( err, JSON.parse( data ) );
    }
  } );
}

function saveState( state ) {
  fs.writeFile( 'state.json', JSON.stringify( state, null, 2 ), ( err, data ) => {
    if ( err ) {
      console.error( `saveState: ${err}` );
    }
  } );
  return state;
}

io.on( 'connection', ( socket ) => {
  socket.on( 'authentication', data => {

      if( !data.cid ) data.cid = socket.client.id;

// console.warn( chalk.blue(`-----------: ${JSON.stringify(data)}`) );
      authenticateUser( state, socket, data, ( err, _state ) => {
        state = _state;

        if( err ) {
          return failAuthenticate( state, socket, `Authentication of ${JSON.stringify(data)} failed: ${err}` );
        } else if ( state.clients.some( c => c.sid == data.id ) ) {
          return failAuthenticate( state, socket, `Authentication of ${JSON.stringify(data)} refused!` );
        } else {
          return postAuthenticate( state, socket );
        }

      } );

  } );
} );

function authenticateUser ( state, socket, data, callback ) {

  let client = state.clients.find( c => c.cid === data.cid );
if(client) console.warn( chalk.magenta(`    STILL ACTIVE: ${client.name} #${client.cid}`) );

  // check if already in state.clientsOld
  if ( !client ) {
    client = state.clientsOld.find( c => c.cid === data.cid );
if(client) console.warn( chalk.magenta(`    RECENT: ${client.name} #${client.cid}`) );
  }

  if ( !client ) {
    client = {
      sid: data.cid, // session id
      cid: data.cid, // client id
      name: NAMES[ ~~( ( NAMES.length - 1 ) * Math.random() ) ],
      color: COLORS[ ~~( ( COLORS.length - 1 ) * Math.random() ) ]
    };
if(client) console.warn( chalk.magenta(`    NEW: ${client.name} #${client.cid}`) );
  }

  client = { ...client,
    sid: socket.client.id,
    ts: Date.now(),
    te: Date.now() + USER_TIMEOUT
  };

  // console.log( `Authentication of ${JSON.stringify(client)}...` );

  return callback( null, {
    ...state,
    clients: [ client, ...state.clients.filter( c => c.cid != data.cid ) ],
    clientsOld: [ ...state.clientsOld.filter( c => c.cid != data.cid ) ]
  } );
}

function failAuthenticate( state, socket, msg ) {

    socket.emit( 'notwelcome', { err: `err: ${msg}` } );

    return state;
}

function postAuthenticate( state, socket ) {

  let client = state.clients.find( c => c.sid == socket.client.id );

  socket.on( 'chat message', function( msg ) {
    state = markClientAlive( state, client );

    if ( msg.data ) {
      console.log( `> ${client.name} #${client.cid}: ${JSON.stringify( msg.data, null, 1 )}` )
      state = newMessage( state, msg );
      socket.emit( 'chat message', msg );
      socket.broadcast.emit( 'chat message', msg );
    }
  } );

  socket.on( 'disconnect', function() {
    console.log( `< a client disconnected: ${client.name} #${client.cid} #${client.sid}` );
    state = onClientDisconnection( state, client );

    state = broadcastState( state );
  } );

  console.log( `> a client connected: ${client.name} #${client.cid} #${client.sid}` );

  socket.emit( 'welcome', { client } );

  return state = broadcastState( state );
}

function onClientDisconnection( state, client ) {
  return {
    ...state,
    clients: state.clients.filter( c => c.sid !== client.sid ),
    clientsOld: [ client, ...state.clientsOld ]
  };
}

function broadcastState( state ) {
  console.log( `Broadcast state.clients: [${
    state.clients.reduce( ( s, c ) => {
      return s + `${style.bgColor.ansi.hex( c.color )}_${style.bgColor.close}${c.name}(${((c.te-Date.now())/1000).toFixed(2)}s), `
    }, '' ).replace(/, $/,'')
  }]`);
  io.of('').emit( 'state.clients', state.clients );

  return state;
}

function markClientAlive( state, client ) {
  return {
    ...state,
    clients: state.clients.map( c => {
      return (c.cid !== client.cid) ? c : {
        ...c,
        ts: Date.now(),
        te: Date.now() + USER_TIMEOUT
      }
    })
  };
}

function cleanState( state ) {
  let now = Date.now();

  let clients = [];
  let goneClients = [];

  state.clients.forEach(c => {
    if( (now - c.ts) > USER_TIMEOUT ){
      goneClients.push(c);
      console.log( `Client ${c.name} is no longer active.` );
    } else {
      clients.push(c);
    }
  });

  // merge
  let clientsOld = goneClients.concat( state.clientsOld.filter( old => {
    (now - old.ts) > USER_TIMEOUT*2 &&
    goneClients.findIndex( gone => old.cid === gone.cid ) < 0
  } ) );

  let newState = {
    ...state,
    clients,
    clientsOld
  };

// if there has been changes
  if( goneClients.length>0 )
    newState = broadcastState( newState );

  return newState;
}

function newMessage( state, msg ) {
  return {
    ...state,
    messages: [...state.messages, msg]
  };
}


// Start server
http.listen( 3000, () => {

  loadState( (err, data) => {

    state = data;
    console.log( 'State loaded:', JSON.stringify(state) );

    console.log( 'listening on *:3000' );

    setInterval( () => {
      state = cleanState( state );
      state = saveState( state );
    }, 10000);

  } );

} );
