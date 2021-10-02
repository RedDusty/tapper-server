const { Socket } = require('socket.io');
const { dbGames, dbLobby, dbOnline } = require('../../db');
const { userScoreDecrease, userScoreAdd } = require('../../firebase');
const { removeKey } = require('../../functions');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('TAP_DOT', (data) => {
    const userData = removeKey(data.user);
    const dotIndex = data.index;
    const code = data.code;

    dbGames.get(code)[dotIndex].user = userData;

    io.in(`LOBBY_${code}`).emit('GAME_TAP', dbGames.get(code));

    const lobby = dbLobby.get(data.code);

    const countPlayers = lobby.users.length;
    const countField = Number(lobby.fieldX) * Number(lobby.fieldY);

    if (dbGames.get(code).filter((dot) => dot.user === undefined).length === 0) {
      if (lobby.users.length > 1) {
        const scoresArray = [];
        lobby.users.forEach((user) => {
          const countDots = dbGames.get(data.code).filter((dot) => dot.user.uid === user.uid).length;
          scoresArray.push({ user: user, score: scoreCount(countPlayers, countField, countDots) });
        });
        const sortScoresArray = scoresArray.sort((userA, userB) => userA.score - userB.score);

        const decreaseScoresArray = sortScoresArray.slice(0, Math.ceil(sortScoresArray.length / 2));
        const addScoresArray = sortScoresArray.slice(Math.ceil(sortScoresArray.length / 2));

        decreaseScoresArray.forEach((dUser) => userScoreDecrease(dUser.user.uid, dUser.score));
        addScoresArray.forEach((aUser) => userScoreAdd(aUser.user.uid, aUser.score));

        const decreasedScores = removeKey(decreaseScoresArray);
        const addedScores = removeKey(addScoresArray);

        io.in(`LOBBY_${code}`).emit('GAME_END_SCORE', {
          decreasedScores,
          addedScores
        });
      } else {
        io.in(`LOBBY_${code}`).emit('GAME_END', true);
      }
    }
  });
};

function scoreCount(players, field, dots) {
  const playersMultiplier = 0.25 * players;
  const fieldMultiplier = 1 + 0.1 * field;
  const dotsMultiplier = 0.25 * dots;
  const finalScore = 10 * ((dotsMultiplier / fieldMultiplier) * playersMultiplier);

  return finalScore;
}
