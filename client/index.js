import io from 'socket.io-client';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';

( () => {
  let ping = null;
  let state = null;
  let socket;

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

  // Action:
  const Action = {
    increase: { type: 'increase' },
    connection: { type: 'connection' },
  };

  // Reducer:
  function reducer( state = { count: 0 }, action ) {
    switch ( action.type ) {
      case 'increase':
        return { count: state.count + 1 };
      default:
        return state;
    }
  }

  // Store:
  const store = createStore( reducer );

  // Map Redux state to component props
  function mapStateToProps( state ) {
    return {
      value: state.count,
    };
  }

  // Map Redux actions to component props
  const mapDispatchToProps = ( dispatch ) => ( {
    onIncreaseClick: () => dispatch( Action.increase )
  } );

  // Connected Component:
  const App = connect(
    mapStateToProps,
    mapDispatchToProps
  )( AppContent );

  ReactDOM.render( < Provider store = { store } >
    < App / >
    < /Provider>,
    document.getElementById( 'main' )
  );

  // ------------------------------------
  // ====================================

  window.onbeforeunload = () => {
    socket.close();
  };

  const loadState = () => ( localStorage.state
    ? JSON.parse( localStorage.state )
    : { client: { chat: true }, clients: [], messages: [] }
  );

  const saveState = ( state ) => {
    localStorage.state = JSON.stringify( state );
    return state;
  };

  const cleanState = ( state ) => state;

  const getClient = ( state, id ) => {
    const client = state.clients.find( c => c.cid === id );
    // if( !client ) throw ":o"
    return client;
  };

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
      const me = getClient( state, state.client.cid );

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
          ${( msg.cid === state.client.cid ? 'me' : msg.name )}
          </b>:
          ${msg.data}`;
        $.chatMessages.appendChild( li );
      }
    },
  };

  const onConnection = () => {
    socket.emit( 'authentication', { client: { ...state.client } } );

    socket.on( 'notwelcome', data => {
      console.error( `Not welcome: ${{ err: null, ...data }.err}` );
    } );

    socket.on( 'welcome', data => {
      // if ( state.client.cid ) {
      //   console.warn( `Welcome for ${state.client.cid} already arrived!` );
      //   return;
      // }

      state = saveState( { ...state, ...data } );

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

        state = $.updateDOM( state );

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

      setInterval( () => {
        state = cleanState( state );
        state = saveState( state );
      }, 5000 );
    } );
  };

  $.chatForm.addEventListener( 'submit', e => {
    e.preventDefault();
    const data = $.chatEntry.value;
    const t = Date.now();
    if ( data ) {
      if ( !state.client.cid ) {
        console.warn( 'Cannot post message while not logged' );
        return;
      }

      socket.emit( 'chat-message', { data, t, cid: state.client.cid }, err => {
        if ( err ) {
          $.addMessage( {
            cid: state.client.cid,
            data: `<span style="color:red">Failed to send:</span> ${data}`
          } );
        } else {
          $.addMessage( { cid: state.client.cid, data } );
        }
      } );
      $.chatEntry.value = '';
      $.chatEntry.focus();
    }
  } );

  socket = io();

  state = loadState();

  socket.on( 'connect', onConnection );

  setTimeout( () => { state = $.updateDOM( state ); }, 100 );
} )();
