const { dbLobby } = require('./db');

function getFreeLobbies() {
  const lobbyListMap = new Map([...dbLobby].filter(([k, v]) => v.isPrivate === false));

  const lobbyListArray = [...lobbyListMap].map((lobby) => {
    const data = lobby[1];
    return {
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

exports.getFreeLobbies = getFreeLobbies;
