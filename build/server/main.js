'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var chalk = require('chalk');
var style = require('ansi-styles');
var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

process.env['DEBUG'] = '*';

var USER_TIMEOUT = 30 * 1000;

var NAMES = ['Henry', 'Luna', 'Oliver', 'Alison', 'Desmond', 'Ava', 'Lincoln', 'Clémentine', 'Lucas', 'Ella', 'Akira', 'Amaterasu', 'Atsuko', 'Arisu', 'Ayaka', 'Jung', 'Iseul', 'Haneul'];
var COLORS = ['#aaa', '#e44', '#4e4', '#44e', '#dcd7d2', '#2b2b2b', '#2a5fe3', '#d94835', '#30a28f', '#7a7a7a', '#049451', '#24364b', '#dadbda', '#84454a', '#c38f3d', '#758b9d', '#ad8989', '#2ea9c3'];

app.get('/', function (req, res) {
  res.sendFile(path.resolve('client/index.html'));
});
app.use('/static', express.static(path.resolve('client')));
app.use('/js', express.static(path.resolve('build/client')));

var state = {
  clients: [],
  clientsOld: []
};

io.on('connection', function (socket) {

  state = onClientConnection(state, socket);

  var client = state.clients.find(function (c) {
    return c.sid == socket.client.id;
  });

  console.log('> a client connected: %s %s', client.name, client.cid, client.sid);

  socket.emit('welcome', client.cid);

  socket.on('chat message', function (msg) {
    client.ts = Date.now();
    console.warn('chat message from "' + client.name + '": "' + msg.data + '"');
    state = pruneClients(state);
    broadcastState(state, socket);

    if (msg.data) {
      console.log('> %s #%s: %s', client.name, client.cid, JSON.stringify(msg.data, null, 1));
      socket.emit('chat message', msg);
      socket.broadcast.emit('chat message', msg);
    }
  });

  socket.on('disconnect', function () {
    console.log('> a client disconnected: %s#%s', client.name, client.cid);
    state = onClientDisconnection(state, socket.client.sid);

    broadcastState(state, socket);
  });

  broadcastState(state, socket);
});

function onClientConnection(state, socket) {

  var client = state.clients.find(function (c) {
    return c.sid === socket.client.id;
  });

  // todo: check if already in state.oldClients

  if (!client) {
    client = {
      sid: socket.client.id, // session id
      cid: socket.client.id, // client id
      name: NAMES[~ ~((NAMES.length - 1) * Math.random())],
      color: COLORS[~ ~((COLORS.length - 1) * Math.random())],
      ts: Date.now()
    };
  }

  return _extends({}, state, {
    clients: [client].concat(_toConsumableArray(state.clients))
  });
}

function onClientDisconnection(state, sid) {
  return _extends({}, state, {
    clients: state.clients.filter(function (c) {
      return c.sid !== sid;
    })
  });
}

function broadcastState(state, socket) {
  console.log('broadcast state.clients: [%s]', state.clients.reduce(function (s, c) {
    return s + '  ' + style.bgColor.ansi.hex(c.color) + c.name + style.bgColor.close + ', ';
  }, ''));
  socket.emit('state.clients', state.clients);
  socket.broadcast.emit('state.clients', state.clients);

  return state;
}

function pruneClients(state) {
  var now = Date.now();
  console.warn('pruning...');
  // todo: one loop
  var clients = state.clients.filter(function (c) {
    return now - c.ts > USER_TIMEOUT;
  });
  var goneClients = state.clients.filter(function (c) {
    return now - c.ts <= USER_TIMEOUT;
  });

  state.clients.forEach(function (c) {
    if (clients.indexOf(c) < 0) {
      console.log('Client ' + c.name + ' is no longer active.');
    }
  });

  var clientsOld = goneClients.concat(state.clientsOld.filter(function (c) {
    return goneClients.findIndex(function (o) {
      return c.cid === o.cid;
    }) < 0;
  }));
  // console.warn('before:',JSON.stringify(state.clients.map(c=> c.ts/1000 ),0,1));
  // console.warn('~~~');
  // console.warn('after:',JSON.stringify(state.clients.map(c=> c.ts/1000 ),0,1));
  return _extends({}, state, {
    clients: clients,
    clientsOld: clientsOld
  });
}

// サーバーをポート3000番で起動
http.listen(3000, function () {
  console.log('listening on *:3000');
});