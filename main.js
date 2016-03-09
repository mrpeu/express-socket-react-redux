var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

process.env['DEBUG'] = '*'

// GETされたらindex.htmlを送信する
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});
app.use(express.static(__dirname + '/client'));


// Core
var state = {
  clients: []
};


// クライアントからの接続を待つ
io.on('connection', function(socket){

  state = onClientConnection(state, socket.client.id);
  var client = state.clients.find(c=>c.id===socket.client.id);

  console.log('> a client connected: %s %s', client.name, client.id);
  // console.log('a client connected:', JSON.stringify(client,null,1));

  socket.emit('you', client.id);


  console.log('broadcast state.clients: %s',
    JSON.stringify(state.clients,null,1),
  '');
  socket.emit('state.clients', state.clients);
  socket.broadcast.emit('state.clients', state.clients);


  // クライアントからメッセージを受け取ったら投げ返す
  socket.on('chat message', function(msg){
    // 同じクライアントに送信する場合は socket.emit を io.emit に変える
    console.log('> %s #%s: %s', client.name, client.id, JSON.stringify(msg.data,null,1))
    socket.emit('chat message', msg);
    socket.broadcast.emit('chat message', msg);
  });

  socket.on('disconnect', function(){
    console.log('> a client disconnected: %s#%s', client.name, client.id);
    state = onClientDisconnection(state, socket.client.id);
  });

});

var names = ['Henry','Luna','Oliver','Alison','Desmond','Ava','Lincoln','Clémentine','Lucas','Ella','Akira','Amaterasu','Atsuko','Arisu','Ayaka','Jung','Iseul','Haneul'];
var colors = ['#aaa','#e44','#4e4','#44e','#dcd7d2','#2b2b2b','#2a5fe3','#d94835','#30a28f','#7a7a7a','#049451','#24364b','#dadbda','#84454a','#c38f3d','#758b9d','#ad8989','#2ea9c3'];

function onClientConnection( state, id ){

  var client = state.clients.find(el=>el.id===id);

  if( client == undefined ){
    client = {
      id: id,
      name: names[~~((names.length-1)*Math.random())],
      color: colors[~~((colors.length-1)*Math.random())]
    };
    state.clients.push( client );
  }

  return state;
}

function onClientDisconnection( state, id ){

  return state.clients.filter(c=>c.id!==id);
}


// サーバーをポート3000番で起動
http.listen(3000, function(){
  console.log('listening on *:3000');
});
