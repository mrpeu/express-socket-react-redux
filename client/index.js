import io from 'socket.io-client';
import {
  createStore
} from 'redux'

( function() {

  var meId = 0;
  var state = {
    clients: []
  };

  var ping = null;

  var socket = io();

  window.onbeforeunload = () => {
    socket.close();
  };


  var $ = {
    login: document.getElementById( 'login' ),
    loginForm: document.getElementById( 'loginForm' ),
    loginUsername: document.getElementById( 'loginUsername' ),
    loginPassword: document.getElementById( 'loginPassword' ),
    loginSend: document.getElementById( 'loginSend' ),

    clientList: document.getElementById( 'clients' ),

    chat: document.getElementById( 'chat' ),
    form: document.getElementById( 'form' ),
    ul: document.getElementById( 'messages' ),
    entry: document.getElementById( 'entry' ),
    name: document.getElementById( 'name' ),

    updateDOM: ( state ) => {
      let me = getClient( meId );

      $.updateClientList( state.clients );

      if( me ){
        $.updateName( me );
        $.login.classList[ 'remove' ]( 'isVisible' );
        $.chat.classList[ 'add' ]( 'isVisible' );
      } else {
        $.updateName( null );
        $.login.classList[ 'add' ]( 'isVisible' );
        $.chat.classList[ 'remove' ]( 'isVisible' );
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
        $.name.textContent = me.name;
        $.name.title = me.cid;
        $.name.style[ "border-color" ] = me.color;
      } else {
        $.name.textContent = 'Not logged in';
        $.name.title = '';
        delete $.name.style[ "border-color" ];
      }
    },

    addMessage: ( msg ) => {
      let sender = getClient( msg.from );
      let li = document.createElement( 'li' );
      li.className = 'chat-line';
      li.innerHTML = '<b style="color:' + sender.color + ';">' +
        ( msg.from == meId ? 'me' : sender.name ) +
        '</b>: ' +
        msg.data;
      $.ul.appendChild( li );
    }
  };

  let getClient = ( id ) => {
    let client = state.clients.find( c => c.cid === id );
    // if(!client) throw ":o"
    return client;
  };



  socket.on( 'welcome', cid => {
    if ( meId ) {
      console.warn( 'Welcome already arrived! ' + meId );
      return;
    }

    meId = cid;
    console.log( `welcome: ${cid}` );

    // setInterval( () => {
    //   let now = Date.now();
    //   for ( var i = 0; i < $.clientList.childNodes.length; ++i ) {
    //     let li = $.clientList.childNodes[ i ];
    //     li.textContent = 't-' + (30-( now - getClient( li.title ).ts ) / 1000).toFixed(2) + 's';
    //   }
    // }, 33 );

    ping = setInterval( () => {
      socket.emit( 'chat message', {
        from: meId
      } );
    }, 10000 );

    state = $.updateDOM( state );
  } );

  socket.on( 'state.clients', clients => {
    state.clients = clients;
    console.log( 'new state.clients %s', JSON.stringify( clients.map( c => c.name ) ) )

    state = $.updateDOM( state );

    if ( state.clients.findIndex( c => c.cid == meId ) < 0 ) {
      // deconnected
      clearInterval( ping );
    }
  } );

  socket.on( 'chat message', ( msg ) => {
    $.addMessage( msg );
  } );

  let authenticate = () => {
    socket.on('authenticated', () => {
      // use the socket as usual
      console.warn( 'authentication successful!' );
    });

    socket.on('unauthorized', function(err){
      console.log("There was an error with the authentication:", err.message); 
    });

    socket.emit('authentication', { username: $.loginUsername.value, password: $.loginPassword.value });
  };



  $.form.addEventListener( 'submit', e => {
    e.preventDefault();
    if ( $.entry.value ) {
      if ( !meId ) {
        console.warn( 'Cannot post message while not logged' );
        return;
      }

      socket.emit( 'chat message', {
        from: meId,
        data: $.entry.value
      } );
      $.entry.value = '';
      $.entry.focus();
    }
    return false;
  } );

  $.loginForm.addEventListener( 'submit' , e => {
    e.preventDefault();
    authenticate();
    return false;
  } );

  setTimeout( () => { state = $.updateDOM(state); }, 100 );

}() )
