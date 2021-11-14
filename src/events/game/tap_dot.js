const { Socket } = require('socket.io');
const { dbGames, dbLobby } = require('../../db');
const { userScoreDecrease, userScoreAdd } = require('../../firebase');
const { removeKey } = require('../../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('TAP_DOT', (data) => {
    const userData = removeKey(data.user);
    const dotIndex = data.index;
    const code = data.code;

    const gTemp = dbGames.get(code);

    if (dbGames.get(code) === false) {
      return 0;
    }

    if (gTemp.dots[dotIndex].user === undefined) {
      dbGames.get(code).dots[dotIndex].user = userData;

      dbGames.get(code).replay.push({
        user: removeKey(data.user),
        index: data.index,
        time: Date.now()
      });

      io.in(`LOBBY_${code}`).emit('GAME_TAP', dbGames.get(code));
    }

    if (dbGames.get(code).dots.filter((dot) => dot.user === undefined).length === 0) {
      const lobby = dbLobby.get(data.code);

      const countPlayers = lobby.users.length;
      const countField = Number(lobby.fieldX) * Number(lobby.fieldY);

      if (lobby.users.length > 1) {
        const scoresArray = [];
        lobby.users.forEach((user) => {
          const countDots = dbGames.get(data.code).dots.filter((dot) => dot.user.uid === user.uid).length;
          scoresArray.push({ user: user, score: scoreCount(countPlayers, countField, countDots) });
        });
        const sortScoresArray = scoresArray.sort((userA, userB) => userA.score - userB.score);

        const decreaseScoresArray = sortScoresArray.slice(0, Math.ceil(sortScoresArray.length / 2));
        const addScoresArray = sortScoresArray.slice(Math.ceil(sortScoresArray.length / 2));

        decreaseScoresArray.forEach((dUser) => userScoreDecrease(dUser.user.uid, dUser.score));
        addScoresArray.forEach((aUser) => userScoreAdd(aUser.user.uid, aUser.score));

        const decreasedScores = removeKey(decreaseScoresArray);
        const addedScores = removeKey(addScoresArray);

        const game = dbGames.get(code);

        const gameData = {
          dots: game.dots,
          time: {
            start: game.time.start,
            end: Date.now()
          },
          replay: game.replay,
          addScore: addedScores,
          decreaseScore: decreasedScores
        };

        io.in(`LOBBY_${code}`).emit('GAME_END_SCORE', gameData);
      } else {
        const game = dbGames.get(code);

        const gameData = {
          dots: game.dots,
          time: {
            start: game.time.start,
            end: Date.now()
          },
          replay: game.replay
        };

        io.in(`LOBBY_${code}`).emit('GAME_END', gameData);
      }
    }
  });
};

function scoreCount(players, field, dots) {
  const playersMultiplier = 0.25 * players;
  const fieldMultiplier = 0.1 * field;
  const dotsMultiplier = 0.25 * (1 + dots);
  const finalScore = playersMultiplier * fieldMultiplier * dotsMultiplier;

  return finalScore;
}
