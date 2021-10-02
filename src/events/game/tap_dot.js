const { Socket } = require('socket.io');
const { dbGames } = require('../../db');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('TAP_DOT', (data) => {
    console.log(data);
    const user = data.user;
    const dotIndex = data.index;
    const code = data.code;

    dbGames.get(code)[dotIndex].user = user;

    io.in(`LOBBY_${code}`).emit('GAME_TAP', dbGames.get(code));
  });
};
