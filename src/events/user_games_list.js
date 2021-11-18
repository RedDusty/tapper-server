const { Socket } = require("socket.io");
const { userGetUserGames } = require("../firebase");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("USER_GAMES_LIST", async (data) => {
    const userGames = await userGetUserGames(data);

    socket.emit("USER_GAMES_LIST_GET", userGames);
  });
};
