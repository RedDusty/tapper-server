const { Socket } = require('socket.io');
const { dbOnline, dbLobby } = require('../db');
const { userScoreAdd } = require('../firebase');

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('SCORE_ADD', (data) => {
    userScoreAdd(data.uid, data.score)
  });
};
