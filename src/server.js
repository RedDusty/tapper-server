const express = require('express');
const socketio = require('socket.io');

const app = express();
app.set('port', process.env.PORT || 3000);

const http = require('http').Server(app);

/** @type {socketio} */
const io = require('socket.io')(http, { pingInterval: 5000 });

const { dbLobby, dbUsers } = require('./db');

const user_login = require('./events/user_login');
const lobby_create = require('./events/lobby_create');
const disconnect = require('./events/disconnect');
const lobby_messenger = require('./events/lobby_messenger');

io.on('connection', (/** @type {socketio.Socket} socket*/ socket) => {
  console.log(socket.id + ' is connected');
  socket.send(socket.id);

  user_login(socket, io);

  lobby_create(socket, io);

  disconnect(socket, io);

  lobby_messenger(socket, io);

  socket.on('SERVER_PING', (func) => {
    if (typeof func === 'function') {
      func();
    }
  });
});

const server = http.listen(3000, (err) => {
  if (err) {
    throw err;
  }
  console.log('Server started - ' + (process.env.PORT || 3000));
});
