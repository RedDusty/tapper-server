const { Socket } = require('socket.io');
const { dbLobby, dbOnline } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('disconnect', (reason) => {
    socket.leave('users');
    socket.leave('online');

    dbLobby.forEach((lobby) => {
      if (lobby.ownerID === socket.id) {
        socket.leave(`LOBBY_${lobby.code}`);
        dbLobby.delete(lobby.code);
        dbOnline.forEach((user) => {
          if (user.id === socket.id) {
            console.log(
              `Lobby ${lobby.code} has been destroyed. Owner: ${lobby.ownerID} | ${user.nickname} | ${user.uid}. Reason: ${reason}`
            );
            return 0;
          }
        });
      }
    });

    if (dbOnline.has(socket.id)) dbOnline.delete(socket.id);

    const lobbyListArray = getFreeLobbies();

    console.log(socket.id + ' has disconnected, reason: ' + reason);
    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    io.in('users').emit('LOBBY_GET', lobbyListArray);
  });
};
