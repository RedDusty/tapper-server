const { Socket } = require('socket.io');
const { dbOnline, dbLobby } = require('../db');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('SKIN_CHANGE', (data) => {
    if (dbOnline.get(data.user.id)) {
      dbOnline.get(data.user.id).skinOptions = data.skinData;
    }

    if (dbLobby.get(data.code)) {
      const lobby = dbLobby.get(data.code);
      const index = lobby.users.findIndex((user) => user.uid === data.user.uid);

      lobby.users[index].skinOptions = data.skinData;

      io.in(`LOBBY_${data.code}`).emit('SKIN_CHANGE_USERS', lobby);
    }
  });
};
