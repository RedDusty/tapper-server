const { Socket } = require("socket.io");
const { dbLobby, dbGames } = require("../../db");
const { removeKey, isAllUsersLoaded, botTap } = require("../../functions");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("USER_LOADED", (data) => {
    if (dbLobby.has(data.lobby.code)) {
      const userIndex = dbLobby
        .get(data.lobby.code)
        .users.findIndex((user) => user.uid === data.user.uid);
      dbLobby.get(data.lobby.code).users[userIndex].isLoaded = true;

      const usersRKey = removeKey(dbLobby.get(data.lobby.code)).users;
      io.in(`LOBBY_${data.lobby.code}`).emit("USER_LOADED_RETURN", usersRKey);
      if (isAllUsersLoaded(data.lobby.code)) {
        io.in(`LOBBY_${data.lobby.code}`).emit("GAME_LOADED", true);

        if (data.lobby.bot.isTurned) {
          setTimeout(() => {
            const field = Number(data.lobby.fieldX) * Number(data.lobby.fieldY);
            botTap(io, socket, data.lobby.code, field, data.lobby.bot.difficulty, data.lobby.bot.speed);
          }, 5000);
        }
      }
    }
  });
};
