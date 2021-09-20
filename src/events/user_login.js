const { Socket } = require('socket.io');
const { dbLobby, dbUsers } = require('../db');

module.exports = function (/** @type {Socket} socket*/ socket, io) {
  socket.on('USER_LOGIN', ({ nickname, avatar, skin, rank, firstLogin, uid, id }) => {
    if (id) {
      if (!dbUsers.has(id)) {
        dbUsers.set(id, {
          nickname,
          avatar,
          skin,
          rank,
          firstLogin,
          uid,
          id
        });
      }
    }

    socket.join('users');
    io.in('users').emit('USERS_UPDATE', dbUsers.size);
    io.in('users').emit('LOBBY_UPDATE', dbLobby.size);
  });
};
