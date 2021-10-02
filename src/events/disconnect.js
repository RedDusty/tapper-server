const { Socket } = require('socket.io');
const { dbOnline } = require('../db');
const { getFreeLobbies, hostChangeOrDestroy, userLeave } = require('../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('disconnect', (reason) => {
    socket.leave('users');
    socket.leave('online');

    try {
      const isHost = hostChangeOrDestroy(io, socket.id, reason);
      if (isHost !== true) {
        try {
          userLeave(io, socket.id);
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      console.log(err);
    }

    if (dbOnline.has(socket.id)) {
      dbOnline.delete(socket.id);
    }

    const lobbyListArray = getFreeLobbies();

    console.log(socket.id + ' has disconnected, reason: ' + reason);
    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    io.in('users').emit('LOBBY_GET', lobbyListArray);
  });
};
