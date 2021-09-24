const { Socket } = require('socket.io');
const { dbLobby } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('LOBBY_USERS', (data) => {
    switch (data.action) {
      case 'userJoin':
        if (dbLobby.has(data.code)) {
          socket.leave('users');
          socket.join(`LOBBY_${data.code}`);
          const lobby = dbLobby.get(data.code);
          lobby.users.push(data.user);
          lobby.inLobbyPlayers = String(lobby.users.length);

          const lobbyListArray = getFreeLobbies();
          io.in('users').emit('LOBBY_GET', lobbyListArray);
          io.in(`LOBBY_${data.code}`).emit('LOBBY_USERS_UPDATE', {
            type: 'userJoin',
            value: lobby.users,
            lobby: lobby
          });
        }
        break;
      default:
        break;
    }
  });
};
