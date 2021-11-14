const { Socket } = require("socket.io");
const { dbOnline } = require("../db");

module.exports = function (/** @type {Socket} socket*/ socket, io) {
  socket.on("USER_LOGOUT", () => {
    if (dbOnline.has(socket.id)) {
      dbOnline.delete(socket.id);
    }

    socket.leave("users");
    socket.leave("online");

    io.in("users").emit("ONLINE_UPDATE", dbOnline.size);
  });
};
