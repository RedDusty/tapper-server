const { Socket } = require('socket.io');
const db = require('../db').db;

module.exports = function (/** @type {Socket} socket*/ socket) {
  socket.on('USER_LOGIN', ({ nickname, avatar, skin, rank, firstLogin, uid, id }) => {
    socket.join('users');

    if (id) {
      if (db.get('users').findIndex((el) => el.id === socket.id) === -1) {
        db.set('users', [
          ...db.get('users'),
          { nickname: nickname, avatar: avatar, skin: skin, rank: rank, firstLogin: firstLogin, uid: uid, id: id }
        ]);
        socket.in('users').emit('USERS_UPDATE', { usersCount: db.get('users').length });
      }
    }
  });
};
