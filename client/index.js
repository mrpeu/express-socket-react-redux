(function(){

  var meId=-1;
  var state = { clients: [] };

  var socket = io();

  window.onbeforeunload = ()=>{
    socket.close();
  };

  var $ = {
    clientList: document.getElementById('clients'),
    ul: document.getElementById('messages'),
    entry: document.getElementById('entry'),
    form: document.getElementById('form'),
    name: document.getElementById('name'),

    updateClientList: (clients) => {
      var el = document.createElement('ul');
      el.id = 'clients';
      clients.map(c=>{
        var elc = document.createElement('li');
        elc.className = 'client';
        elc.title = c.id;
        elc.textContent = c.name;
        elc.style['border-color'] = c.color;
        el.appendChild(elc);
      });
//       console.log( $.clientList.parentNode )
      $.clientList.parentNode.replaceChild(el, $.clientList);
      $.clientList = document.getElementById('clients');
    },
    updateName: (me) => {
      $.name.textContent = me.name;
      $.name.title = me.id;
      $.name.style["border-left-color"] = me.color;
    },
    addMessage: (msg) => {
      var li = document.createElement('li');
      li.className = 'chat-line';
      li.innerHTML = '<b style="color:'+me.color+';">'+
        (msg.from==me.id?'me':getClient(msg.from).name)+
        '</b>: '+
        msg.data
      ;
      $.ul.appendChild(li);
    }
  };


  getMe = () => getClient(meId);

  getClient = (id) => state.clients.find(c=>c.id===id);


  socket.on('you', id=>{
    meId=id;
//     console.log('you:', id)
  });

  socket.on('state.clients', clients=>{
    state.clients = clients;
    console.log('new state.clients %s', JSON.stringify(clients.map(c=>c.name)))

    $.updateClientList(state.clients);

    me = getMe();
    $.updateName(me);
  } );

  $.form.addEventListener('submit', e=>{
    e.preventDefault();
    if($.entry.value){
      socket.emit('chat message', {from:meId, data:$.entry.value});
      $.entry.value = '';
    }
    return false;
  });

  socket.on('chat message', (msg)=>{
    var me = getMe();
    $.addMessage(msg);
  });

}())