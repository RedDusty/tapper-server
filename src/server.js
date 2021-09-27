const express = require('express');
const socketio = require('socket.io');

const app = express();
app.set('port', process.env.PORT || 3000);

const http = require('http').Server(app);

/** @type {socketio} */
const io = require('socket.io')(http, { pingInterval: 5000 });

const { dbLobby, dbUsers } = require('./db');

const user_login = require('./events/user_login');
const disconnect = require('./events/disconnect');

const lobby_create = require('./events/lobby/lobby_create');
const lobby_messenger = require('./events/lobby/lobby_messenger');
const lobby_options = require('./events/lobby/lobby_options');
const lobby_users = require('./events/lobby/lobby_users');

const user_loaded = require('./events/game/user_loaded');
const game_loading = require('./events/game/game_loading');

const { getFreeLobbies } = require('./functions');

io.on('connection', (/** @type {socketio.Socket} socket*/ socket) => {
  console.log(socket.id + ' is connected');
  socket.send(socket.id);

  user_login(socket, io);
  disconnect(socket, io);

  lobby_create(socket, io);
  lobby_messenger(socket, io);
  lobby_options(socket, io);
  lobby_users(socket, io);

  user_loaded(socket, io);
  game_loading(socket, io)

  socket.on('LOBBY_GET_FIRST', (id) => {
    const lobbyListArray = getFreeLobbies();
    io.to(id).emit('LOBBY_GET', lobbyListArray);
  });

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
