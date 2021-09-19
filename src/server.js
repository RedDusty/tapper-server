const express = require('express');
const socketio = require('socket.io');

const app = express();
app.set('port', process.env.PORT || 3000);

const http = require('http').Server(app);

/** @type {socketio} */
const io = require('socket.io')(http, { pingInterval: 5000 });

const db = require('./db').db;

const user_login = require('./events/user_login');

io.on('connection', (/** @type {socketio.Socket} socket*/ socket) => {
  console.log(socket.id + ' is connected');
  socket.send(socket.id);

  user_login(socket, io);

  socket.on('LOBBY_CREATE', (data) => {
    socket.leave('users');
    socket.join('playing');
    const newDBlobby = [
      ...db.get('lobby'),
      {
        id: data.id,
        nickname: data.users[0].nickname,
        shape: data.shape,
        players: data.players,
        rounds: data.rounds,
        field: data.field,
        users: data.users
      }
    ];
    db.set('lobby', newDBlobby);
    socket.in('users').emit('LOBBY_UPDATE', db.get('games'));

    const newDBplaying = [
      ...db.get('playing'),
      {
        nickname,
        avatar,
        skin,
        rank,
        firstLogin,
        uid,
        id
      }
    ];
    db.set('playing', newDBplaying);

    socket.in('users').emit('USERS_UPDATE', { usersCount: db.get('users').length });
    socket.in('users').emit('PLAYING_UPDATE', { playingCount: db.get('playing').length });

    console.log(`Game ${data.id} has been created.`);
  });

  socket.on('disconnect', (reason) => {
    socket.leave('users');
    const index = db.get('users').findIndex((el) => el.id === socket.id);
    const newArr = db.get('users').slice();
    newArr.splice(index, 1);
    db.set('users', newArr);
    console.log(socket.id + ' has disconnected, reason: ' + reason);
    socket.in('users').emit('USERS_UPDATE', { usersCount: db.get('users').length });
  });

  socket.on('ping', (func) => {
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
