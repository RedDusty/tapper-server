const { Socket } = require('socket.io');
const { dbLobby, dbOnline } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} socket*/ socket, io) {
  socket.on('USER_LOGIN', ({ nickname, avatar, skin, score, firstLogin, uid, id, banned, skinURL }) => {
    if (id) {
      if (!dbOnline.has(id)) {
        dbOnline.set(id, {
          nickname,
          avatar,
          skin,
          score,
          firstLogin,
          uid,
          id,
          banned,
          skinURL
        });
      }
    }

    socket.join('users');
    socket.join('online');

    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    socket.emit('LOBBY_GET', getFreeLobbies());
  });
};
