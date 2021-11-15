const { Socket } = require("socket.io");
const { dotTap } = require("../../functions");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("TAP_DOT", (data) => {
    dotTap(io, socket, data.index, data.code, data.user);
  });
};
