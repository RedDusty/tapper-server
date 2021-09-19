const { Socket } = require('socket.io');
const db = require('../db').db;

module.exports = function (/** @type {Socket} socket*/ socket, io) {
  socket.on('USER_LOGIN', ({ nickname, avatar, skin, rank, firstLogin, uid, id }) => {
    if (id) {
      if (db.get('users').findIndex((el) => el.id === socket.id) === -1) {
        db.set('users', [
          ...db.get('users'),
          { nickname: nickname, avatar: avatar, skin: skin, rank: rank, firstLogin: firstLogin, uid: uid, id: id }
        ]);
      }
    }

    socket.join('users');
    io.in('users').emit('USERS_UPDATE', { usersCount: db.get('users').length });
    io.in('users').emit('PLAYING_UPDATE', { playingCount: db.get('playing').length });
  });
};
