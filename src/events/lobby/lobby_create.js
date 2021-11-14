const { Socket } = require('socket.io');
const { dbLobby, dbOnline } = require('../../db');
const { getFreeLobbies, hostChangeOrDestroy, userLeave } = require('../../functions');

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
    socket.leave('users');

    try {
      const isHost = hostChangeOrDestroy(io, socket.id, 'Another game is created');
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

    let code = codeGenerator();

    do {
      if (dbLobby.has(code)) {
        code = codeGenerator();
      }
    } while (dbLobby.has(code));

    socket.join(`LOBBY_${code}`);

    Object.assign(data, { code: code });

    dbLobby.set(code, data);

    const lobbyListArray = getFreeLobbies();

    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    io.in('users').emit('LOBBY_GET', lobbyListArray);
    socket.emit('LOBBY_GET_CODE', code);

    console.log(`Lobby ${code} has been created. Owner: ${data.ownerUID} | ${data.nickname} | ${data.users[0].id}`);
  });
};
