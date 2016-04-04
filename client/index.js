import io from 'socket.io-client';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import * as Actions from './actions.js';
import App from './component/App.jsx';
import _throttle from 'lodash/throttle';

( () => {
  let ping = null;
  const socket = io();
  let store = {};

  /* DOM */
  const $ = {
    connection: document.getElementById( 'connection' ),

    content: document.getElementById( 'content' ),

    chat: document.querySelector( '.chat' ),
    chatForm: document.getElementById( 'chatForm' ),
    chatMessages: document.getElementById( 'chatMessages' ),
    chatEntry: document.getElementById( 'chatEntry' ),
    Username: document.getElementById( 'Username' ),

    updateDOM: ( state ) => {
      const me = state.client;

      if ( me ) {
        $.updateName( me );
        $.connection.classList.remove( 'on' );
        $.content.classList.add( 'on' );
        $.chat.classList.add( 'on' );
      } else {
        $.updateName( null );
        $.connection.classList.add( 'on' );
        $.content.classList.remove( 'on' );
        $.chat.classList.remove( 'on' );
      }

      $.updateMessages( state.messages );

      // document.getElementById( 'contentDebug' ).innerHTML =
      //   `<pre>${JSON.stringify( state,0,1 )}</pre>`;

      return state;
    },
    updateName: client => {
      if ( client ) {
        let icon = '';
        if ( !!client.chat ) icon += '💬';
        if ( !!client.runner ) icon += '⚙';

        $.Username.innerHTML =
          `<div class="icon">${icon}</div>` +
          `<div class="name">${client.name}</div>`
        ;
        $.Username.title = client.cid;
        $.Username.style[ 'border-color' ] = client.color;
      } else {
        $.Username.htmlContent = 'Not logged in';
        $.Username.title = '';
        delete $.Username.style[ 'border-color' ];
      }
    },
    updateMessages: messages => {
      const nodesArray = [ ...$.chatMessages.querySelectorAll( 'li.chat-line' ) ];
      nodesArray
        .filter( n => !messages.some( m => `${m.t}~${m.cid}` === n.id ) )
        .forEach( n => { n.parentNode.removeChild( n ); console.log( '#' ); } )
      ;
      messages.forEach( m => { $.addMessage( m, nodesArray ); } );
    },

    addMessage: ( msg, nodesArray = [ ...$.chatMessages.querySelectorAll( 'li.chat-line' ) ] ) => {
      const thisMsgId = `${msg.t}~${msg.cid}`;
      if ( !nodesArray.some(
        li => li.id === thisMsgId
      ) ) {
        const li = document.createElement( 'li' );
        li.className = 'chat-line';
        li.id = thisMsgId;
        li.title = new Date( msg.t );
        li.innerHTML = `<b style="color:${msg.color || 'inherit'};">
          ${msg.name}
          </b>:
          ${msg.data}`;
        $.chatMessages.appendChild( li );
      }
    },
  };


  /* store.app */

  const loadState = () => ( {
    ...( localStorage.state ? JSON.parse( localStorage.state ) : {} ),
    ...{ count: 0, client: { role: 'chat' }, clients: [], messages: [] }
  } );

  const saveState = () => {
    localStorage.state = JSON.stringify( store.getState() );
  };

  const cleanState = ( state ) => state;


  /* store.client */

  function onConnection( client, action ) {
    action.socket.emit( 'authentication', { client } );

    action.socket.on( 'notwelcome', data => {
      store.dispatch( Actions.notwelcome( data ) );
    } );

    action.socket.on( 'welcome', data => {
      store.dispatch( Actions.welcome( data ) );
    } );

    return client;
  }

  function authenticationFailed( state, action ) {
    console.error( `Not welcome: ${{ err: null, ...action }.err}` );
    return state;
  }

  function authenticationSucceed( client, action ) {
    const newClient = action.data.client;

    if ( action.data.err ||
      !newClient || !newClient.name || !newClient.cid || !newClient.color ) {
      console.error( `Authentication failed to succeed! ${JSON.stringify( action, 0, 1 )}` );
      return client;
    }

    console.log( `Welcome: %c${newClient.name} #${newClient.cid}`, `color:${newClient.color}` );

    // rudimentary "I-am-alive" ping
    if ( ping ) clearInterval( ping );
    ping = setInterval( () => {
      // console.log( `socket.emit( 'chat-message', { cid: ${newClient.cid} } );\n` );
      socket.emit( 'chat-message', { cid: newClient.cid }, () => {} );
    }, 30000 );

    socket.on( 'state', serverState => { store.dispatch( Actions.receiveState( serverState ) ); } );

    socket.on( 'chat-message', ( msg ) => { store.dispatch( Actions.receiveMessage( msg ) ); } );

    return newClient;
  }

  function receiveState( state, action ) {
    state = {
      ...state,
      ...action.serverState,
      messages: action.serverState.messages.slice( -4 )
    };

    // console.warn( JSON.stringify( serverState ) );

    // console.warn( 'new state.clients(%d) %s',
    //   state.clients.length,
    //   JSON.stringify( state.clients.map( c => c.name ) )
    // );

    if ( !state.clients.some( c => c.cid === state.client.cid ) ) {
      console.error( 'Not in the client list! ' +
        `${state.client.cid}  C  ${state.clients.map( c => c.cid ).join( ', ' )};`
      );
      clearInterval( ping );
      // state.client.cid = null;
    }

    return state;
  }


  /* store.messages */
  function sendMessage( clients, action ) {
    const me = action.client;
    if ( !me.cid ) {
      console.warn( 'Cannot post message while not logged in' );
      return clients;
    }

    const msg = {
      data: action.msg,
      t: Date.now(),
      cid: me.cid,
      name: me.name,
      color: me.color
    };

    socket.emit( 'chat-message', msg, response => {
      if ( response.err ) {
        $.addMessage( {
          ...response,
          name: 'Error',
          data: `"${action.msg}"` +
            `<span style="color:red">${response.err}</span>`
        } );
      } else {
        $.addMessage( response );
        $.chatEntry.value = '';
      }
    } );
    $.chatEntry.focus();

    return clients;
  }


  /* reducers */
  function reducerRoot( rootState = loadState(), action ) {
    action.client = rootState.client;

    switch ( action.type ) {
      case Actions.Types.dummyIncreaseCount:
        return ( function dummyReducer( app ) {
          return { ...app, count: app.count + 1 };
        }() );

      case Actions.Types.receiveState:
        return receiveState( rootState, action );

      case Actions.Types.cleanState:
        return cleanState( rootState );

      default:
        return rootState;
    }
  }
  function reducerClient( client = {}, action ) {
    switch ( action.type ) {
      case Actions.Types.authenticateSocketOnConnection:
        return onConnection( client, action );
      case Actions.Types.welcome:
        return authenticationSucceed( client, action );
      case Actions.Types.notwelcome:
        return authenticationFailed( client, action );

      default:
        return client;
    }
  }
  function reducerClients( clients = [], action ) {
    switch ( action.type ) {
      case Actions.Types.update:
        return clients;

      default:
        return clients;
    }
  }
  function reducerMessages( messages = [], action ) {
    switch ( action.type ) {

      case Actions.Types.sendMessage:
        return sendMessage( messages, action );

      default:
        return messages;
    }
  }

  function mainReducer( _state = loadState(), action ) {
    _state = reducerRoot( _state, action );
    return {
      ..._state,
      ...{ client: reducerClient( _state.client, action ) },
      ...{ clients: reducerClients( _state.clients, action ) },
      ...{ messages: reducerMessages( _state.messages, action ) }
    };
  }

  // Store:
  store = createStore( mainReducer );

  store.subscribe( _throttle(
    () => {
      $.updateDOM( store.getState() );
      saveState();
    }, 1000 )
  );


  // ====================================
  // ------------------------------------

  // React component
  ReactDOM.render(
    <Provider store = { store }>
      <App />
    </Provider>,
    document.getElementById( 'main' )
  );

  // ------------------------------------
  // ====================================


  window.onbeforeunload = () => {
    socket.close();
  };

  const getClient = ( state, id ) => {
    const client = state.clients.find( c => c.cid === id );
    // if( !client ) throw ":o"
    return client;
  };

  $.chatForm.addEventListener( 'submit', e => {
    e.preventDefault();
    const msg = $.chatEntry.value;
    if ( msg ) {
      store.dispatch( Actions.sendMessage( msg ) );
    }
  } );

  socket.on( 'connect', () => {
    store.dispatch( Actions.authenticateSocketOnConnection( socket ) );
  } );
} )();
