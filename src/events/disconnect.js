const { Socket } = require('socket.io');
const { dbLobby, dbOnline } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('disconnect', (reason) => {
    socket.leave('users');
    socket.leave('online');

    dbLobby.forEach((lobby) => {
      dbOnline.forEach((user) => {
        if (user.id === socket.id) {
          socket.leave(`LOBBY_${lobby.code}`);
          if (user.uid === lobby.ownerUID) {
            dbLobby.delete(lobby.code);
            console.log(
              `Lobby ${lobby.code} has been destroyed. Owner: ${lobby.ownerUID} | ${user.nickname} | ${user.uid}. Reason: ${reason}`
            );
          }
          return 0;
        }
      });
      if (lobby.ownerUID === socket.id) {
      }
      lobby.users.forEach((user, index) => {
        if (user.id === socket.id) {
          lobby.users.splice(index, 1);
          lobby.inLobbyPlayers = String(lobby.users.length);
          lobby.messages.push({
            avatar: 'system',
            id: 'system',
            nickname: 'System',
            uid: 'system',
            message: `${user.nickname} disconnected`,
            time: Date.now(),
            code: lobby.code
          });
          const lobbyListArray = getFreeLobbies();
          io.in('users').emit('LOBBY_GET', lobbyListArray);
          io.in(`LOBBY_${lobby.code}`).emit('LOBBY_GET_MESSAGES', lobby.messages);
          io.in(`LOBBY_${lobby.code}`).emit('LOBBY_USERS_UPDATE', {
            type: 'userLeave',
            value: lobby.users,
            lobby: lobby
          });
          return 0;
        }
      });
    });

    if (dbOnline.has(socket.id)) dbOnline.delete(socket.id);

    const lobbyListArray = getFreeLobbies();

    console.log(socket.id + ' has disconnected, reason: ' + reason);
    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    io.in('users').emit('LOBBY_GET', lobbyListArray);
  });
};
