import io from 'socket.io-client';
import {
  createStore
} from 'redux'

( function() {

  var ping = null;

  var socket = io();
  socket.on( 'connect', onConnection );

  window.onbeforeunload = () => {
    socket.close();
  };

  var state = loadState( {
    client: { cid: null },
    clients: []
  } );

  function loadState( defaultState ) {
    return localStorage.state ? JSON.parse(localStorage.state) : defaultState;
  };

  function saveState( state ) {
    localStorage.state = JSON.stringify(state);
    return state;
  };

  function cleanState( state ) {
    return state;
  }


  var $ = {
    connection: document.getElementById( 'connection' ),

    clientList: document.getElementById( 'clients' ),

    content: document.getElementById( 'content' ),

    chat: document.getElementById( 'chat' ),
    chatForm: document.getElementById( 'chatForm' ),
    chatMessages: document.getElementById( 'chatMessages' ),
    chatEntry: document.getElementById( 'chatEntry' ),
    chatName: document.getElementById( 'chatName' ),

    updateDOM: ( state ) => {
      let me = getClient( state.client.cid );

      $.updateClientList( state.clients );

      if( me ){
        $.updateName( me );
        $.connection.classList[ 'remove' ]( 'on' );
        $.content.classList[ 'add' ]( 'on' );
        $.chat.classList[ 'add' ]( 'on' );
      } else {
        $.updateName( null );
        $.connection.classList[ 'add' ]( 'on' );
        $.content.classList[ 'remove' ]( 'on' );
        $.chat.classList[ 'remove' ]( 'on' );
      }

      return state;
    },
    updateClientList: ( clients ) => {
      let el = document.createElement( 'ul' );
      el.id = 'clients';
      clients.map( c => {
        let elc = document.createElement( 'li' );
        elc.className = 'client';
        elc.title = c.cid;
        elc.textContent = c.name;
        elc.style[ 'border-color' ] = c.color;
        el.appendChild( elc );
      } );
      //       console.log( $.clientList.parentNode )
      $.clientList.parentNode.replaceChild( el, $.clientList );
      $.clientList = document.getElementById( 'clients' );
    },
    updateName: ( me ) => {
      if ( me ) {
        $.chatName.textContent = me.name;
        $.chatName.title = me.cid;
        $.chatName.style[ "border-color" ] = me.color;
      } else {
        $.chatName.textContent = 'Not logged in';
        $.chatName.title = '';
        delete $.chatName.style[ "border-color" ];
      }
    },

    addMessage: ( msg ) => {
      let sender = getClient( msg.from );
      let li = document.createElement( 'li' );
      li.className = 'chat-line';
      li.innerHTML = '<b style="color:' + sender.color + ';">' +
        ( msg.from == state.client.cid ? 'me' : sender.name ) +
        '</b>: ' +
        msg.data;
      $.chatMessages.appendChild( li );
    }
  };

  let getClient = ( id ) => {
    let client = state.clients.find( c => c.cid === id );
    // if(!client) throw ":o"
    return client;
  };


  function onConnection(){

    socket.emit( 'authentication', state.client );

    socket.on( 'notwelcome', data => {
      data = { err: null, ...data};
      console.error( `Not welcome: ${data.err}` );
    } );

    socket.on( 'welcome', data => {
      // if ( state.client.cid ) {
      //   console.warn( `Welcome for ${state.client.cid} already arrived!` );
      //   return;
      // }

      data = { client: { cid: null }, err: null, ...data};

      console.log( `Welcome: ${data.client.cid}` );

      state.client.cid = data.client.cid;

      // rudimentary "I-am-alive" ping
      ping = setInterval( () => {
        socket.emit( 'chat message', { from: state.client.cid } );
      }, 10000 );

      state = $.updateDOM( state );

      socket.on( 'state.clients', clients => {
        state.clients = clients;
        console.log( 'new state.clients %s', JSON.stringify( clients.map( c => c.name ) ) )

        state = $.updateDOM( state );

        if ( state.clients.findIndex( c => c.cid == state.client.cid ) < 0 ) {
          // deconnected
          clearInterval( ping );
          state.client.cid = null;
        }
      } );

      socket.on( 'chat message', ( msg ) => {
        $.addMessage( msg );
      } );

      setInterval( () => {
        state = cleanState( state );
        state = saveState( state );
      }, 10000);

    } );

  }



  $.chatForm.addEventListener( 'submit', e => {
    e.preventDefault();
    if ( $.chatEntry.value ) {
      if ( !state.client.cid ) {
        console.warn( 'Cannot post message while not logged' );
        return;
      }

      socket.emit( 'chat message', {
        from: state.client.cid,
        data: $.chatEntry.value
      } );
      $.chatEntry.value = '';
      $.chatEntry.focus();
    }
    return false;
  } );

  setTimeout( () => { state = $.updateDOM(state); }, 100 );

}() )
