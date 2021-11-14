const { Socket } = require("socket.io");
const { globalChat } = require("../../db");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("G_CHAT_MESSENGER", (data) => {
    if (data.type === "join") {
      socket.join("global_chat");
      socket.emit("G_CHAT_USERS", {
        messages: globalChat,
      });
    }
    if (data.type === "leave") {
      socket.leave("global_chat");
    }
    if (data.type === "message") {
      if (globalChat.length > 100) {
        globalChat.splice(0, globalChat.length - 101);
      }
      Object.assign(data.message, { time: Date.now() });
      globalChat.push(data.message);
      io.in("global_chat").emit("G_CHAT_MESSAGES", { messages: globalChat });
    }
  });
};
