const { Socket } = require("socket.io");
const { dbGames, dbLobby } = require("../../db");
const { userScoreDecrease, userScoreAdd } = require("../../firebase");
const { removeKey, destroyLobbyAndGame } = require("../../functions");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("TAP_DOT", (data) => {
    const userData = removeKey(data.user);
    const dotIndex = data.index;
    const code = data.code;

    const gTemp = dbGames.get(code);

    if (!dbGames.has(code)) {
      return 0;
    }

    if (gTemp.dots[dotIndex].user === undefined) {
      dbGames.get(code).dots[dotIndex].user = userData;

      dbGames.get(code).replay.push({
        user: removeKey(data.user),
        index: data.index,
        time: Date.now(),
      });

      io.in(`LOBBY_${code}`).emit("GAME_TAP", dbGames.get(code));
    }

    if (
      dbGames.get(code).dots.filter((dot) => dot.user === undefined).length ===
      0
    ) {
      const lobby = dbLobby.get(data.code);

      const countPlayers = lobby.users.length;
      const countField = Number(lobby.fieldX) * Number(lobby.fieldY);

      if (lobby.users.length > 1) {
        const usersByScore = lobby.users
          .slice(0)
          .sort((userA, userB) => userA.score - userB.score);
        const usersDots = [];
        lobby.users.forEach((user) => {
          const dots = dbGames
            .get(data.code)
            .dots.filter((dot) => dot.user.uid === user.uid).length;
          usersDots.push({ user: user, dots: dots });
        });
        const usersByDots = usersDots
          .slice(0)
          .sort((userA, userB) => userA.dots - userB.dots);

        const minusScore = usersByDots.slice(
          0,
          Math.ceil(usersByDots.length / 2)
        );
        const plusScore = usersByDots.slice(Math.ceil(usersByDots.length / 2));

        minusScore.forEach((uData, index) => {
          const scoreIndex = usersByScore.findIndex(
            (u) => u.id === uData.user.id
          );
          const dotsIndex = usersByDots.findIndex(
            (u) => u.user.id === uData.user.id
          );
          minusScore[index] = {
            user: uData.user,
            dots: uData.dots,
            score: 0 - scoreIndex - dotsIndex,
          };
        });

        plusScore.forEach((uData, index) => {
          const scoreIndex = usersByScore.findIndex(
            (u) => u.id === uData.user.id
          );
          const dotsIndex = usersByDots.findIndex(
            (u) => u.user.id === uData.user.id
          );
          plusScore[index] = {
            user: uData.user,
            dots: uData.dots,
            score: 0 + scoreIndex + dotsIndex,
          };
        });

        console.log(plusScore, minusScore);

        minusScore.forEach((dUser) => {
          userScoreDecrease(dUser.user.uid, dUser.score);
        });
        plusScore.forEach((aUser) => userScoreAdd(aUser.user.uid, aUser.score));

        const decreasedScores = removeKey(minusScore);
        const addedScores = removeKey(plusScore);

        const game = dbGames.get(code);

        const gameData = {
          dots: game.dots,
          time: {
            start: game.time.start,
            end: Date.now(),
          },
          replay: game.replay,
          addScore: addedScores,
          decreaseScore: decreasedScores,
        };

        io.in(`LOBBY_${code}`).emit("GAME_END_SCORE", gameData);
      } else {
        const game = dbGames.get(code);

        const gameData = {
          dots: game.dots,
          time: {
            start: game.time.start,
            end: Date.now(),
          },
          replay: game.replay,
        };

        io.in(`LOBBY_${code}`).emit("GAME_END", gameData);
      }

      console.log(
        `Lobby ${lobby.code} has been destroyed. Owner: ${lobby.ownerUID} | ${lobby.nickname} | ${lobby.uid}. Reason: The game is over.`
      );
      destroyLobbyAndGame(lobby.code);
    }
  });
};
