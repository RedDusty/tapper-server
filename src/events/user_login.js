const { Socket } = require('socket.io');
const { dbLobby, dbOnline } = require('../db');
const { getFreeLobbies } = require('../functions');

module.exports = function (/** @type {Socket} socket*/ socket, io) {
  socket.on('USER_LOGIN', ({ nickname, avatar, skin, score, firstLogin, uid, id, banned, skinURL, key }) => {
    
    let isDuplicate = false
    dbOnline.forEach((user) => {
      if (user.uid === uid) {
        isDuplicate = true;
      }
    })

    if (isDuplicate) {
      socket.emit("ACCOUNT_DUPLICATE", true)
      return 0;
    }

    if (id) {
      if (!dbOnline.has(id)) {
        dbOnline.set(id, {
          nickname,
          avatar,
          skin,
          score,
          firstLogin,
          uid,
          id,
          banned,
          skinURL,
          key
        });
      }
    }

    socket.join('users');
    socket.join('online');

    io.in('users').emit('ONLINE_UPDATE', dbOnline.size);
    socket.emit('LOBBY_GET', getFreeLobbies());
  });
};
