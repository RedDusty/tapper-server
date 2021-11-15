const { Socket } = require("socket.io");
const { dbLobby, dbGames } = require("../../db");
const { getFreeLobbies, removeKey, getBotConfig } = require("../../functions");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("GAME_START", (data) => {
    if (dbLobby.has(data.code)) {
      const lobby = dbLobby.get(data.code);
      const users = lobby.users;
      if (lobby.bot.isTurned) {
        users.push(getBotConfig());
      }
      let dots = [];
      const fieldSize =
        (Number(lobby.fieldX) || 1) * (Number(lobby.fieldY) || 1);
      let posY = 0;
      for (let dot = 0; dot < fieldSize; dot++) {
        const posX = (dot % Number(lobby.fieldX || 1)) + 1;
        if (dot % Number(lobby.fieldY || 1) === 0) {
          posY += 1;
        }
        dots.push({
          posX: posX,
          posY: posY,
          user: undefined,
          index: dot,
        });
      }
      dbLobby.get(data.code).visibility = "game";
      dbGames.set(data.code, {
        dots: dots,
        time: {
          start: Date.now(),
          end: null,
        },
        replay: [],
        addScore: [],
        decreaseScore: [],
      });

      const lobbyListArray = getFreeLobbies();

      const usersRKey = removeKey(users);

      io.in("users").emit("LOBBY_GET", lobbyListArray);
      const field = {
        dots: dots,
        fieldX: Number(lobby.fieldX || 1),
        fieldY: Number(lobby.fieldY || 1),
      };
      io.in(`LOBBY_${data.code}`).emit("GAME_LOADING", {
        lobby,
        field,
        users: usersRKey,
      });
    }
  });
};
