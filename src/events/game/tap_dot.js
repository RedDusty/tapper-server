const { Socket } = require('socket.io');
const { dbLobby, dbGames } = require('../../db');
const { getFreeLobbies } = require('../../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('TAP_DOT', (data) => {
      const user = data.user;
      const dotIndex = data.index;
      const code = data.code;

      dbGames.get(code)[dotIndex - 1].user = user;

      io.in(`LOBBY_${code}`).emit('GAME_TAP', dbGames.get(code))
  });
};
