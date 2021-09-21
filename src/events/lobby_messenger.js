const { Socket } = require('socket.io');
const { dbLobby } = require('../db');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('LOBBY_MESSENGER', (data) => {
    if (dbLobby.has(data.code)) {
      dbLobby.get(data.code).messages.push(data);
      io.in(`LOBBY_${data.code}`).emit('LOBBY_GET_MESSAGES', dbLobby.get(data.code).messages);
    }
  });
};
