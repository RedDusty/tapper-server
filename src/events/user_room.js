const { Socket } = require('socket.io');
const { dbOnline } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('USER_ROOM', ({ user, code, room }) => {
    if (room === 'game_end') {
      dbOnline.set(socket.id, user);

      socket.join('users');
      socket.join('online');
      socket.leave(`LOBBY_${code}`);
    }

    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    socket.emit('LOBBY_GET', getFreeLobbies());
  });
};
