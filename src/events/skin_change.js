const { Socket } = require('socket.io');
const { dbOnline, dbLobby } = require('../db');
const { userSkinChange } = require('../firebase');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('SKIN_CHANGE', (data) => {
    if (dbOnline.get(data.user.id)) {
      dbOnline.get(data.user.id).skin = data.skinData;
    }

    userSkinChange(data.user.uid, data.user.skin);

    if (dbLobby.get(data.code)) {
      const lobby = dbLobby.get(data.code);
      const index = lobby.users.findIndex((user) => user.uid === data.user.uid);

      lobby.users[index].skin = data.skinData;

      io.in(`LOBBY_${data.code}`).emit('SKIN_CHANGE_USERS', lobby);
    }
  });
};
