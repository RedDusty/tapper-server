const { dbLobby, dbOnline } = require('./db');

function getFreeLobbies() {
  const lobbyListPublic = new Map([...dbLobby].filter(([k, v]) => v.visibility === 'public'));

  const lobbyListNotFull = new Map([...lobbyListPublic].filter(([k, v]) => v.inLobbyPlayers < v.maxPlayers));

  const lobbyListArray = [...lobbyListNotFull].map((lobby) => {
    const data = lobby[1];
    return {
      ownerUID: data.ownerUID,
      avatar: lobby[1].users[0].avatar,
      nickname: data.nickname,
      shape: data.shape,
      inLobbyPlayers: data.inLobbyPlayers,
      maxPlayers: data.maxPlayers,
      rounds: data.rounds,
      fieldX: data.fieldX,
      fieldY: data.fieldY,
      code: data.code
    };
  });

  return lobbyListArray;
}

function hostChangeOrDestroy(io, socketID, reason) {
  const disUser = [...dbOnline.values()].filter((user) => user.id === socketID)[0];

  if (disUser) {
    const ownLobby = [...dbLobby.values()].filter((lobby) => lobby.ownerUID === disUser.uid)[0];
    if (ownLobby) {
      if (ownLobby.users.length === 1) {
        dbLobby.delete(ownLobby.code);
        console.log(
          `Lobby ${ownLobby.code} has been destroyed. Owner: ${ownLobby.ownerUID} | ${disUser.nickname} | ${disUser.uid}. Reason: ${reason}`
        );
      } else {
        ownLobby.users.splice(0, 1);
        ownLobby.ownerUID = ownLobby.users[0].uid;
        ownLobby.nickname = ownLobby.users[0].nickname;
        ownLobby.inLobbyPlayers = String(ownLobby.users.length);
        ownLobby.messages.push({
          avatar: 'system',
          id: 'system',
          nickname: 'System',
          uid: 'system',
          message: `${disUser.nickname} disconnected. ${ownLobby.nickname} now is owner!`,
          time: Date.now(),
          code: ownLobby.code
        });

        io.in(`LOBBY_${ownLobby.code}`).emit('LOBBY_GET_MESSAGES', ownLobby.messages);
        io.in(`LOBBY_${ownLobby.code}`).emit('LOBBY_USERS_UPDATE', {
          type: 'hostChange',
          value: ownLobby.users,
          lobby: ownLobby
        });
      }
    }
  }
}

function userLeave(io, socketID) {
  const disUser = [...dbOnline.values()].filter((user) => user.id === socketID)[0];

  if (disUser) {
    const disLobby = [...dbLobby.values()].filter((lobby) => {
      const findUser = lobby.users.filter((user) => disUser.uid === user.uid);
      if (findUser.length > 0) {
        return findUser[0].uid === disUser.uid;
      }
    });

    if (disLobby && disLobby.length > 0) {
      const userIndex = disLobby[0].users.findIndex((user) => user.uid === disUser.uid);
      disLobby[0].users.splice(userIndex, 1);
      disLobby[0].inLobbyPlayers = String(disLobby[0].users.length);
      disLobby[0].messages.push({
        avatar: 'system',
        id: 'system',
        nickname: 'System',
        uid: 'system',
        message: `${disUser.nickname} disconnected`,
        time: Date.now(),
        code: disLobby[0].code
      });

      io.in(`LOBBY_${disLobby[0].code}`).emit('LOBBY_GET_MESSAGES', disLobby[0].messages);
      io.in(`LOBBY_${disLobby[0].code}`).emit('LOBBY_USERS_UPDATE', {
        type: 'userLeave',
        value: disLobby[0].users,
        lobby: disLobby[0]
      });
    }
  }
}

exports.userLeave = userLeave;
exports.hostChangeOrDestroy = hostChangeOrDestroy;
exports.getFreeLobbies = getFreeLobbies;
