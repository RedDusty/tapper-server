const { Socket } = require('socket.io');
const { dbLobby } = require('../../db');
const { getFreeLobbies } = require('../../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('LOBBY_OPTIONS', (data) => {
    if (dbLobby.has(data.code)) {
      switch (data.option) {
        case 'setVisibility': {
          dbLobby.get(data.code).isPrivate = data.visibility;
          emitter(io, data.code, data.visibility, 'setVisibility');
          break;
        }
        case 'setShape': {
          dbLobby.get(data.code).shape = data.shape;
          emitter(io, data.code, data.shape, 'setShape');
          break;
        }
        case 'setRounds': {
          dbLobby.get(data.code).rounds = data.rounds;
          emitter(io, data.code, data.rounds, 'setRounds');
          break;
        }
        case 'setFieldX': {
          dbLobby.get(data.code).fieldX = data.fieldX;
          emitter(io, data.code, data.fieldX, 'setFieldX');
          break;
        }
        case 'setFieldY': {
          dbLobby.get(data.code).fieldY = data.fieldY;
          emitter(io, data.code, data.fieldY, 'setFieldY');
          break;
        }
        case 'setInLobbyPlayers': {
          dbLobby.get(data.code).inLobbyPlayers = data.inLobbyPlayers;
          emitter(io, data.code, data.inLobbyPlayers, 'setInLobbyPlayers');
          break;
        }
        case 'setMaxPlayers': {
          dbLobby.get(data.code).maxPlayers = data.maxPlayers;
          emitter(io, data.code, data.maxPlayers, 'setMaxPlayers');
          break;
        }
        // case 'userKick': {
        //   const users = dbLobby.get(data.code).users;
        //   const newUsers = users.filter((u, i) => data.kickID !== u.id);
        //   dbLobby.get(data.code).users = newUsers;
        //   emitter(io, data.code, data.kickID, 'userKick');
        //   break;
        // }
        default:
          break;
      }
    }
  });
};

function emitter(io, code, option, type) {
  const lobbyListArray = getFreeLobbies();

  io.in('users').emit('LOBBY_GET', lobbyListArray);
  io.in(`LOBBY_${code}`).emit('LOBBY_OPTIONS_UPDATE', {
    option,
    type,
    code
  });
}
