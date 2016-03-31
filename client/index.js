import io from 'socket.io-client';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore } from 'redux';
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

    updateDOM: ( state, me ) => {
      // const me = getClient( state, state.client.cid );

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
        li.innerHTML = `<b style="color:${msg.color || 'inherit'};">
          ${( msg.cid === msg.name )}
          </b>:
          ${msg.data}`;
        $.chatMessages.appendChild( li );
      }
    },
  };


  /* store.app */

  const loadState = () => ( localStorage.state
    ? JSON.parse( localStorage.state )
    : { client: { chat: true }, clients: [], messages: [] }
  );

  const saveState = ( state ) => {
    localStorage.state = JSON.stringify( state );
    return state;
  };

  const cleanState = ( state ) => state;


  /* store.client */

  function onConnection( state, action ) {
    socket.emit( 'authentication', { client: state.client } );

    socket.on( 'notwelcome', data => {
      store.dispatch( Actions.Types.notwelcome, data );
    } );

    socket.on( 'welcome', data => {
      store.dispatch( Actions.Types.welcome, data );
    } );
  }

  function authenticationFailed( state, action ) {
    console.error( `Not welcome: ${{ err: null, ...state }.err}` );
    return state;
  }

  function authenticationSucceed( state, action ) {
    // if ( state.client.cid ) {
    //   console.warn( `Welcome for ${state.client.cid} already arrived!` );
    //   return;
    // }

    console.log( `Welcome: ${state.client.cid}` );

    // rudimentary "I-am-alive" ping
    if ( ping ) clearInterval( ping );
    ping = setInterval( () => {
      console.log( `socket.emit( 'chat-message', { cid: ${state.client.cid} } );\n` );
      socket.emit( 'chat-message', { cid: state.client.cid }, () => {} );
    }, 30000 );

    socket.on( 'state', serverState => {
      state = { ...state, ...serverState };

      // console.warn( JSON.stringify( serverState ) );

      // console.warn( 'new state.clients(%d) %s',
      //   state.clients.length,
      //   JSON.stringify( state.clients.map( c => c.name ) )
      // );

      $.updateDOM( state );

      if ( !state.clients.some( c => c.cid === state.client.cid ) ) {
        console.error( 'Not in the client list! ' +
          `${state.client.cid}  C  ${state.clients.map( c => c.cid ).join( ', ' )};`
        );
        clearInterval( ping );
        // state.client.cid = null;
      }
    } );

    state = $.updateDOM( state );

    socket.on( 'chat-message', ( msg ) => {
      if ( Array.isArray( msg ) ) {
        msg.forEach( $.addMessage );
      } else {
        $.addMessage( msg );
      }
    } );
  }


  /* store.messages */
  function emitMessage( state, action ) {
    const me = state.client;

    if ( !me.cid ) {
      console.warn( 'Cannot post message while not logged in' );
      return state;
    }

    socket.emit( 'chat-message', { msg: action.msg, t: Date.now(), cid: me.cid }, err => {
      if ( err ) {
        $.addMessage( {
          cid: me.cid,
          data: `<span style="color:red">Failed to send:</span> ${action.msg}`
        } );
      } else {
        $.addMessage( { cid: me.cid, msg: action.msg } );
      }
    } );

    $.chatEntry.value = '';
    $.chatEntry.focus();

    return state;
  }


  /* reducers */
  function reducerClient( state = {}, action ) {
    switch ( action.type ) {
      case Actions.Types.authenticateSocketOnConnection:
        return onConnection( state, action );
      case Actions.Types.welcome:
        return authenticationSucceed( state, action );
      case Actions.Types.notwelcome:
        return authenticationFailed( state, action );

      default:
        return state;
    }
  }
  function reducerClients( state = [], action ) {
    switch ( action.type ) {
      case Actions.Types.update:
        return state;

      default:
        return state;
    }
  }
  function reducerMessages( state = [], action ) {
    switch ( action.type ) {
      case Actions.Types.receiveMessage:
        return state;
      case Actions.Types.sendMessage:
        return emitMessage( state, action );

      default:
        return state;
    }
  }

  const appReducers = combineReducers( {
    client: reducerClient,
    clients: reducerClients,
    messages: reducerMessages,
  } );
  const rootReducer = function rootReducer( state = loadState(), action ) {
    switch ( action.type ) {
      case Actions.Types.dummyIncreaseCount:
        state = { count: state.count + 1 };
        break;
      case Actions.Types.cleanState:
        state = cleanState( state );
        break;
      default:
        break;
    }

    return appReducers( state, action );
  };

  // Store:
  store = createStore( rootReducer );

  store.subscribe( // _.throttle(
    () => {
      saveState( store.getState() );
      store.dispatch( Actions.cleanState );
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
      value: state.app.count,
    };
  }

  // Map Redux actions to component props
  const mapDispatchToProps = ( dispatch ) => ( {
    onIncreaseClick: () => dispatch( Actions.Types.app )
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
    const data = $.chatEntry.value;
    if ( data ) {
      store.dispatch( Actions.Types.sendMessage, data );
    }
  } );

  socket = io();

  socket.on( 'connect', () => {
    store.dispatch( Actions.Types.authenticateSocketOnConnection );
  } );
} )();
