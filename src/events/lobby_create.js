const { Socket } = require('socket.io');
const { dbLobby, dbUsers } = require('../db');

function codeGenerator() {
  const arr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

  let code = '';

  for (let i = 0; i < 6; i++) {
    const random = Math.floor(Math.random() * arr.length);
    code += arr[random];
  }

  return code;
}

module.exports = function (/** @type {Socket} socket*/ socket, io) {
  socket.on('LOBBY_CREATE', (data) => {
    socket.join('lobby');

    if (dbLobby.has(data.code)) dbLobby.delete(data.code);

    let code = codeGenerator();

    do {
      if (dbLobby.has(code)) {
        code = codeGenerator();
      }
    } while (dbLobby.has(code));

    dbLobby.set(code, data);

    io.in('users').except('lobby').emit('USERS_UPDATE', { usersCount: dbUsers.size });
    io.in('users').except('lobby').emit('LOBBY_UPDATE', { lobbyCount: dbLobby.size });
    io.to(socket.id).emit('LOBBY_CODE', { code });

    console.log(`Game ${code} has been created. Owner: ${data.ownerID} | ${data.nickname} | ${data.uid}`);
  });
};
