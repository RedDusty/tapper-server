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

    const hasGame = [...dbLobby].filter(([k, v]) => v.ownerID === socket.id);

    if (hasGame[0]) {
      try {
        dbLobby.delete(hasGame[0][1].code);
        console.log(
          `Game ${hasGame[0][1].code} already exists of user ${hasGame[0][1].users[0].nickname} | ${hasGame[0][1].users[0].uid} | ${socket.id}. Deleting...`
        );
      } catch (err) {
        console.log(`Game ${hasGame[0][1].code} cannot be deleted. Error.`);
      }
    }

    if (dbLobby.has(data.code)) dbLobby.delete(data.code);

    let code = codeGenerator();

    socket.join(code);

    do {
      if (dbLobby.has(code)) {
        code = codeGenerator();
      }
    } while (dbLobby.has(code));

    Object.assign(data, { code: code });

    dbLobby.set(code, data);

    const lobbyListMap = new Map([...dbLobby].filter(([k, v]) => v.isPrivate === false));

    const lobbyListArray = [...lobbyListMap].map((lobby) => {
      return {
        nickname: lobby.nickname,
        shape: lobby.shape,
        players: lobby.players,
        rounds: lobby.rounds,
        field: lobby.field
      };
    });

    io.in('users').except('lobby').emit('USERS_UPDATE', dbUsers.size);
    io.in('users').except('lobby').emit('LOBBY_UPDATE', dbLobby.size);
    io.in('users').except('lobby').emit('LOBBY_GET', lobbyListArray);
    socket.emit('LOBBY_GET_CODE', code);

    console.log(`Game ${code} has been created. Owner: ${data.ownerID} | ${data.nickname} | ${data.uid}`);
  });
};
