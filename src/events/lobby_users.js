const { Socket } = require('socket.io');
const { dbLobby } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('LOBBY_USERS', (data) => {
    switch (data.action) {
      case 'userJoin': {
        if (dbLobby.has(data.code)) {
          socket.leave('users');
          socket.join(`LOBBY_${data.code}`);
          const lobby = dbLobby.get(data.code);
          lobby.users.push(data.user);
          lobby.inLobbyPlayers = String(lobby.users.length);
          lobby.messages.push({
            avatar: 'system',
            id: 'system',
            nickname: 'System',
            uid: 'system',
            message: `${data.user.nickname} connected`,
            time: Date.now(),
            code: data.code
          });

          const lobbyListArray = getFreeLobbies();
          io.in('users').emit('LOBBY_GET', lobbyListArray);
          io.in(`LOBBY_${data.code}`).emit('LOBBY_GET_MESSAGES', lobby.messages);
          io.in(`LOBBY_${data.code}`).emit('LOBBY_USERS_UPDATE', {
            type: 'userJoin',
            value: lobby.users,
            lobby: lobby
          });
        }
        return 0;
      }
      case 'userLeave': {
        if (dbLobby.has(data.code)) {
          socket.join('users');
          socket.leave(`LOBBY_${data.code}`);
          const lobby = dbLobby.get(data.code);
          lobby.users.forEach((user, index) => {
            if (user.id === socket.id) {
              lobby.users.splice(index, 1);
              lobby.inLobbyPlayers = String(lobby.users.length);

              return 0;
            }
          });
          lobby.messages.push({
            avatar: 'system',
            id: 'system',
            nickname: 'System',
            uid: 'system',
            message: `${data.user.nickname} disconnected`,
            time: Date.now(),
            code: data.code
          });

          const lobbyListArray = getFreeLobbies();
          io.in('users').emit('LOBBY_GET', lobbyListArray);
          io.in(`LOBBY_${data.code}`).emit('LOBBY_GET_MESSAGES', lobby.messages);
          socket.in(`LOBBY_${data.code}`).emit('LOBBY_USERS_UPDATE', {
            type: 'userLeave',
            value: lobby.users,
            lobby: lobby
          });
        }
        return 0;
      }
      default:
        return 0;
    }
  });
};
