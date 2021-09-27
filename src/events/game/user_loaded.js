const { Socket } = require('socket.io');
const { dbLobby } = require('../../db');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('USER_LOADED', (data) => {
    if (dbLobby.has(data.lobby.code)) {
      const lobby = dbLobby.get(data.lobby.code);
      const userIndex = lobby.users.findIndex(user => user.uid = data.user.uid);
      const user = lobby.users[userIndex];
      user.isLoaded = true;
      io.in(`LOBBY_${data.code}`).emit('USER_LOADED', dbLobby.get(data.code).users);
    }
  });
};
