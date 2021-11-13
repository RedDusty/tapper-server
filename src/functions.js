const { dbLobby, dbOnline, dbGames } = require('./db');

function getFreeLobbies() {
  const lobbyListPublic = new Map([...dbLobby].filter(([k, v]) => v.visibility === 'public'));

  const lobbyListNotFull = new Map([...lobbyListPublic].filter(([k, v]) => v.inLobbyPlayers < v.maxPlayers));

  const lobbyListArray = [...lobbyListNotFull].map((lobby) => {
    const data = lobby[1];
    return {
      ownerUID: data.ownerUID,
      avatar: lobby[1].users[0].avatar,
      nickname: data.nickname,
      inLobbyPlayers: data.inLobbyPlayers,
      maxPlayers: data.maxPlayers,
      fieldX: data.fieldX,
      fieldY: data.fieldY,
      code: data.code
    };
  });

  return lobbyListArray;
}

function hostChangeOrDestroy(io, socketID, reason) {
  const disUser = [...dbOnline.values()].filter((user) => user.id === socketID)[0];

  let isHost = false;

  if (disUser) {
    const ownLobby = [...dbLobby.values()].filter((lobby) => lobby.ownerUID === disUser.uid)[0];
    if (ownLobby) {
      if (ownLobby.visibility !== 'game') {
        if (ownLobby.users.length === 1) {
          dbLobby.delete(ownLobby.code);
          console.log(
            `Lobby ${ownLobby.code} has been destroyed. Owner: ${ownLobby.ownerUID} | ${disUser.nickname} | ${disUser.uid}. Reason: ${reason}`
          );
        } else {
          isHost = true;
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

          const usersRKey = removeKey(ownLobby.users);
          Object.assign(ownLobby, { users: usersRKey });

          io.in(`LOBBY_${ownLobby.code}`).emit('LOBBY_GET_MESSAGES', ownLobby.messages);
          io.in(`LOBBY_${ownLobby.code}`).emit('LOBBY_USERS_UPDATE', {
            type: 'hostChange',
            value: ownLobby.usersRKey,
            lobby: ownLobby
          });
        }
      } else {
        const userIndex = ownLobby.users.findIndex((user) => user.id === socketID);
        dbLobby.get(ownLobby.code).users[userIndex].isLeft = true;
      }
    }
  }

  return isHost;
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

    if (disLobby) {
      if (disLobby.length > 0 && disLobby[0].visibility !== 'game') {
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

        const usersRKey = removeKey(disLobby[0].users);
        Object.assign(disLobby[0], { users: usersRKey });

        io.in(`LOBBY_${disLobby[0].code}`).emit('LOBBY_GET_MESSAGES', disLobby[0].messages);
        io.in(`LOBBY_${disLobby[0].code}`).emit('LOBBY_USERS_UPDATE', {
          type: 'userLeave',
          value: disLobby[0].users,
          lobby: disLobby[0]
        });
      } else if (disLobby.length > 0 && disLobby[0].visibility === 'game') {
        const userIndex = disLobby[0].users.findIndex((user) => user.id === socketID);
        dbLobby.get(disLobby[0].code).users[userIndex].isLeft = true;
      }
    }
  }
}

function destroyLobbyAndGame(code) {
  dbLobby.delete(code);
  dbGames.delete(code);
}

function removeKey(users) {
  let temp = users;
  try {
    if (users[0] && users[0].uid) {
      temp = users.map((user) => ({ ...user, key: null }));
      return temp;
    } else if (users.users && users.users[0] && users.users[0].uid) {
      temp = users.users.map((user) => ({ ...user, key: null }));
      Object.assign(users, { users: temp });
      return users;
    } else
    if (users.uid) {
      users.key = null;
      return users;
    }
    throw new Error('Key is not removed! - functions.js [141]')
  } catch (error) {
    console.log(error);
  }
}

exports.destroyLobbyAndGame = destroyLobbyAndGame;
exports.userLeave = userLeave;
exports.hostChangeOrDestroy = hostChangeOrDestroy;
exports.getFreeLobbies = getFreeLobbies;
exports.removeKey = removeKey;
