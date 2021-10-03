const { Socket } = require('socket.io');
const { query, collection, orderBy, limit, getDocs } = require('firebase/firestore');
const firestore = require('../../fbConfig').firestore;
const removeKey = require('../functions').removeKey;

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on('SCORE_GET', async () => {
    const q = query(collection(firestore, 'users'), orderBy('score', 'desc'), limit(25));

    const users = []

    const querySnapshots = await getDocs(q);

    querySnapshots.forEach(doc => {
        const user = removeKey(doc.data());

        users.push(user);
    })

    socket.emit('SCORE_RETURN', users);
  });
};