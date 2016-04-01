import io from 'socket.io-client';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import * as Actions from './actions.js';

( () => {
  let ping = null;
  let socket;
  let store = {};

  /* DOM */
  const $ = {
    connection: document.getElementById( 'connection' ),

    clientList: document.getElementById( 'clients' ),

    content: document.getElementById( 'content' ),

    chat: document.getElementById( 'chat' ),
    chatForm: document.getElementById( 'chatForm' ),
    chatMessages: document.getElementById( 'chatMessages' ),
    chatEntry: document.getElementById( 'chatEntry' ),
    Username: document.getElementById( 'Username' ),

    updateDOM: ( state ) => {
      const me = state.client;

      $.updateClientList( state.clients );

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

      state.messages.forEach( $.addMessage );

      // document.getElementById( 'contentDebug' ).innerHTML =
      //   `<pre>${JSON.stringify( state,0,1 )}</pre>`;

      return state;
    },
    updateClientList: ( clients ) => {
      const el = document.createElement( 'ul' );
      el.id = 'clients';
      clients.forEach( c => {
        const elc = document.createElement( 'li' );
        elc.className = 'client';
        elc.title = c.cid;

        let icon = '';
        if ( !!c.chat ) icon += '💬';
        if ( !!c.runner ) icon += '⚙';

        elc.innerHTML =
          `<div class="icon">${icon}</div>` +
          `<div class="name">${c.name}</div></span>`
        ;
        elc.style[ 'border-color' ] = c.color;
        el.appendChild( elc );
      } );
      //       console.log( $.clientList.parentNode )
      $.clientList.parentNode.replaceChild( el, $.clientList );
      $.clientList = document.getElementById( 'clients' );
    },
    updateName: ( c ) => {
      if ( c ) {
        let icon = '';
        if ( !!c.chat ) icon += '💬';
        if ( !!c.runner ) icon += '⚙';

        $.Username.innerHTML =
          `<div class="icon">${icon}</div>` +
          `<div class="name">${c.name}</div>`
        ;
        $.Username.title = c.cid;
        $.Username.style[ 'border-color' ] = c.color;
      } else {
        $.Username.htmlContent = 'Not logged in';
        $.Username.title = '';
        delete $.Username.style[ 'border-color' ];
      }
    },

    addMessage: ( msg ) => {
      const thisMsgId = `${msg.t}~${msg.cid}`;
      if ( ![ ...$.chatMessages.querySelectorAll( 'li.chat-line' ) ].some(
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
    ...{ count: 0, client: { chat: true }, clients: [], messages: [] }
  } );

  const saveState = ( state ) => {
    localStorage.state = JSON.stringify( state );
    return state;
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
      console.log( `socket.emit( 'chat-message', { cid: ${newClient.cid} } );\n` );
      socket.emit( 'chat-message', { cid: newClient.cid }, () => {} );
    }, 30000 );

    socket.on( 'state', serverState => { store.dispatch( Actions.receiveState( serverState ) ); } );

    socket.on( 'chat-message', ( msg ) => { store.dispatch( Actions.receiveMessage( msg ) ); } );

    return newClient;
  }

  function receiveState( state, action ) {
    state = { ...state, ...action.serverState };

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

  function receiveMessage( messages, action ) {
    if ( Array.isArray( action.msg ) ) {
      action.msg.forEach( $.addMessage );
      return [ ...messages, ...action.msg ];
    } else {
      $.addMessage( action.msg );
      return [ ...messages, action.msg ];
    }
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
          cid: me.cid,
          data: `<span>Failed to send: "${action.msg}".</span>` +
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
      case Actions.Types.receiveMessage:
        return messages;
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

  store.subscribe( // _.throttle(
    () => {
      $.updateDOM( store.getState() );
  //     store.dispatch( Actions.cleanState() );
    }// , 5000 )
  );


  // ====================================
  // ------------------------------------

  // React component
  const AppContent = ( { value, onIncreaseClick } ) =>
    <div>
      <span>{ value }</span>
      <button onClick = { onIncreaseClick } >Increase</button>
    </div>
  ;

  AppContent.propTypes = {
    value: PropTypes.number.isRequired,
    onIncreaseClick: PropTypes.func.isRequired,
  };

  // Map Redux state to component props
  function mapStateToProps( state ) {
    return {
      value: state.count,
    };
  }

  // Map Redux actions to component props
  const mapDispatchToProps = ( dispatch ) => ( {
    onIncreaseClick: () => dispatch( Actions.dummyIncreaseCount() )
  } );

  // Connected Component:
  const App = connect(
    mapStateToProps,
    mapDispatchToProps
  )( AppContent );

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

  socket = io();

  socket.on( 'connect', () => {
    store.dispatch( Actions.authenticateSocketOnConnection( socket ) );
  } );
} )();
