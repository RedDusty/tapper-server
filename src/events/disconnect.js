const { Socket } = require('socket.io');
const { dbLobby, dbUsers } = require('../db');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('disconnect', (reason) => {
    socket.leave('users');
    socket.leave('lobby');


    dbLobby.forEach((lobby) => {
      if (lobby.ownerID === socket.id) {
        dbLobby.delete(lobby.code);
        dbUsers.forEach((user) => {
          if (user.id === socket.id) {
            console.log(
              `Game ${lobby.code} has been destroyed. Owner: ${lobby.ownerID} | ${user.nickname} | ${user.uid}. Reason: ${reason}`
            );
            return 0;
          }
        });
      }
    });
    
    if (dbUsers.has(socket.id)) dbUsers.delete(socket.id);

    console.log(socket.id + ' has disconnected, reason: ' + reason);
    io.in('users').emit('USERS_UPDATE', dbUsers.size);
    io.in('users').emit('LOBBY_UPDATE', dbLobby.size);
  });
};
