const { Socket } = require("socket.io");
const { dbLobby } = require("../../db");
const { getFreeLobbies } = require("../../functions");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("LOBBY_OPTIONS", (data) => {
    if (dbLobby.has(data.code)) {
      const lobby = dbLobby.get(data.code);
      switch (data.option) {
        case "setVisibility": {
          emitterMessage(
            io,
            data,
            lobby.visibility,
            data.visibility,
            "Visibility"
          );
          lobby.visibility = data.visibility;
          emitterOption(io, data.code, data.visibility, "setVisibility");
          break;
        }
        case "setFieldX": {
          emitterMessage(io, data, lobby.fieldX, data.fieldX, "Field X");
          const emittedNumber = () => {
            if (data.fieldX && Number(data.fieldX) > 0) {
              return data.fieldX;
            } else {
              return String(1);
            }
          };
          lobby.fieldX = emittedNumber();
          emitterOption(io, data.code, data.fieldX, "setFieldX");
          break;
        }
        case "setFieldY": {
          emitterMessage(io, data, lobby.fieldY, data.fieldY, "Field Y");
          const emittedNumber = () => {
            if (data.fieldY && Number(data.fieldY) > 0) {
              return data.fieldY;
            } else {
              return String(1);
            }
          };
          lobby.fieldY = emittedNumber();
          emitterOption(io, data.code, data.fieldY, "setFieldY");
          break;
        }
        case "setInLobbyPlayers": {
          lobby.inLobbyPlayers = data.inLobbyPlayers;
          emitterOption(
            io,
            data.code,
            data.inLobbyPlayers,
            "setInLobbyPlayers"
          );
          break;
        }
        case "setMaxPlayers": {
          emitterMessage(
            io,
            data,
            lobby.maxPlayers,
            data.maxPlayers,
            "Max Players"
          );
          lobby.maxPlayers = data.maxPlayers;
          emitterOption(io, data.code, data.maxPlayers, "setMaxPlayers");
          break;
        }
        default:
          break;
      }
    }
  });
};

function emitterMessage(io, data, oldValue, newValue, field) {
  if (oldValue !== newValue) {
    const lobby = dbLobby.get(data.code);
    const messages = lobby.messages;
    const messageData = {
      avatar: "system",
      code: data.code,
      id: "system",
      message: `${field}: ${oldValue} => ${newValue}`,
      nickname: "System",
      time: Date.now(),
      uid: "system",
    };
    messages.push(messageData);
    io.in(`LOBBY_${data.code}`).emit("LOBBY_GET_MESSAGES", lobby.messages);
  }
}

function emitterOption(io, code, option, type) {
  const lobbyListArray = getFreeLobbies();
  io.in("users").emit("LOBBY_GET", lobbyListArray);
  io.in(`LOBBY_${code}`).emit("LOBBY_OPTIONS_UPDATE", {
    option,
    type,
    code,
  });
}
