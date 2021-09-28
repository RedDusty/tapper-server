const { dbLobby } = require('./db');

function getFreeLobbies() {
  const lobbyListPublic = new Map([...dbLobby].filter(([k, v]) => v.isPrivate === false));

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

exports.getFreeLobbies = getFreeLobbies;
