import io from 'socket.io-client';
import {
  createStore
} from 'redux'

( function() {

  var meId = -1;
  var state = {
    clients: []
  };

  var ping = null;

  var socket = io();

  window.onbeforeunload = () => {
    socket.close();
  };

  var $ = {
    clientList: document.getElementById( 'clients' ),
    ul: document.getElementById( 'messages' ),
    entry: document.getElementById( 'entry' ),
    form: document.getElementById( 'form' ),
    name: document.getElementById( 'name' ),

    updateClientList: ( clients ) => {
      var el = document.createElement( 'ul' );
      el.id = 'clients';
      clients.map( c => {
        var elc = document.createElement( 'li' );
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
      if( me ){
        $.name.textContent = me.name;
        $.name.title = me.cid;
        $.name.style[ "border-left-color" ] = me.color;
      } else {
        $.name.textContent = '';
        $.name.title = '';
        delete $.name.style[ "border-left-color" ];
      }
    },
    addMessage: ( msg ) => {
      let me = getMe();
      let li = document.createElement( 'li' );
      li.className = 'chat-line';
      li.innerHTML = '<b style="color:' + me.color + ';">' +
        ( msg.from == me.cid ? 'me' : getClient( msg.from ).name ) +
        '</b>: ' +
        msg.data;
      $.ul.appendChild( li );
    }
  };

  var getMe = () => {
    let me = getClient( meId )
    // if ( !me ) throw "no me!!!"
    return me
  };

  var getClient = ( id ) => state.clients.find( c => c.cid === id );


  socket.on( 'welcome', cid => {
    if(meId) {
      console.warn( 'Welcome already arrived! ' + meId );
      return;
    }

    meId = cid;
    console.log( 'welcome:', cid );

    setInterval( () => {
      let now = Date.now();
      for ( var i = 0; i < $.clientList.childNodes.length; ++i ) {
        let li = $.clientList.childNodes[ i ];
        li.textContent = 't-' + (30-( now - getClient( li.title ).ts ) / 1000).toFixed(2) + 's';
      }
    }, 33 );

    ping = setInterval( () => {
      // redumentary ping
      socket.emit( 'chat message', {
        from: meId
      } );
    }, 10000 );
  } );

  socket.on( 'state.clients', clients => {
    state.clients = clients;
    console.log( 'new state.clients %s', JSON.stringify( clients.map( c => c.name ) ) )

    $.updateClientList( state.clients );

    $.updateName( meId ? getMe() : null );

    if( state.clients.findIndex( c => c.cid == meId ) > -1 ) {
      // deconnected
      clearInterval( ping );
    }
  } );

  socket.on( 'chat message', ( msg ) => {
    $.addMessage( msg );
  } );


  $.form.addEventListener( 'submit', e => {
    e.preventDefault();
    if ( $.entry.value ) {
      socket.emit( 'chat message', {
        from: meId,
        data: $.entry.value
      } );
      $.entry.value = '';
    }
    return false;
  } );



}() )
