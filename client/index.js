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

    updateDOM: ( state ) => {
      const me = state.client;

      if ( me ) {
        $.connection.classList.remove( 'on' );
      } else {
        $.connection.classList.add( 'on' );
      }

      return state;
    }
  };


  /* store.app */

  const loadState = () => ( {
    ...{ count: 0, client: { role: 'chat' }, clients: [], chat: { on: false, messages: [] } },
    ...( localStorage.state ? JSON.parse( localStorage.state ) : {} )
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

    socket.on( 'run-status', c => { store.dispatch( Actions.receiveRunStatus( c ) ); } );

    return newClient;
  }

  function onReceiveRunStatus( client, action ) {
    console.warn( 'receivedStatus action:', action.data.runs);
    return {
      ...client,
      runs: {
        ...client.runs,
        ...action.runs
      }
    };
  }


  function receiveState( state, action ) {
    state = {
      ...state,
      ...action.serverState,
      chat: {
        ...state.chat,
        messages: action.serverState.chat.messages
      },
    };

    return state;
  }


  /* store.chat */
  function sendMessage( chat, action ) {
    const me = action.client;
    if ( !me.cid ) {
      console.warn( 'Cannot post message while not logged in' );
      return chat;
    }

    const msg = {
      data: action.data,
      t: Date.now()
    };

    socket.emit( 'chat-message', msg, response => {
      action.cb( response );
    } );

    return chat;
  }

  function toggleChat( chat ) {
    return { ...chat, on: !chat.on };
  }


  /* reducers */
  function reducerRoot( rootState = loadState(), action ) {
    action.client = rootState.client;

    switch ( action.type ) {
      case Actions.Types.dummyIncreaseCount:
        return ( function dummyReducer( app ) {
          return { ...app, count: app.count + 1 };
        }( rootState ) );

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
      case Actions.Types.receiveRunStatus:
        return onReceiveRunStatus( client, action );

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
  function reducerChat( chat = {}, action ) {
    switch ( action.type ) {

      case Actions.Types.sendMessage:
        return { ...chat, messages: sendMessage( chat.messages, action ) };

      case Actions.Types.toggleChat:
        return toggleChat( chat, action );

      default:
        return chat;
    }
  }

  function mainReducer( _state = loadState(), action ) {
    if ( action.type !== undefined && Actions.Types[ action.type ] === undefined ) {
      if ( action.type !== '@@redux/INIT' ) {
        console.warn( `Not implemented Actions.Types "${action.type}"` );
      }
    }

    _state = reducerRoot( _state, action );
    return {
      ..._state,
      ...{ client: reducerClient( _state.client, action ) },
      ...{ clients: reducerClients( _state.clients, action ) },
      ...{ chat: reducerChat( _state.chat, action ) }
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

  socket.on( 'connect', () => {
    store.dispatch( Actions.authenticateSocketOnConnection( socket ) );
  } );
} )();
