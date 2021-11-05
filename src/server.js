const express = require("express");
const socketio = require("socket.io");

const cors = require("cors");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.set("port", PORT);

const http = require("http").Server(app);

/** @type {socketio} */
const io = require("socket.io")(http, { pingInterval: 5000 });

const { dbOnline } = require("./db");

const user_login = require("./events/user_login");
const disconnect = require("./events/disconnect");
const skin_change = require("./events/skin_change");
const score_get = require("./events/score_get");

const lobby_create = require("./events/lobby/lobby_create");
const lobby_messenger = require("./events/lobby/lobby_messenger");
const lobby_options = require("./events/lobby/lobby_options");
const lobby_users = require("./events/lobby/lobby_users");

const user_loaded = require("./events/game/user_loaded");
const game_loading = require("./events/game/game_loading");
const tap_dot = require("./events/game/tap_dot");

const { getFreeLobbies } = require("./functions");
const user_room = require("./events/user_room");

io.on("connection", (/** @type {socketio.Socket} socket*/ socket) => {
  console.log(socket.id + " is connected");
  socket.send(socket.id);

  user_login(socket, io);
  disconnect(socket, io);
  skin_change(socket, io);
  score_get(socket, io);
  user_room(socket, io);

  lobby_create(socket, io);
  lobby_messenger(socket, io);
  lobby_options(socket, io);
  lobby_users(socket, io);

  user_loaded(socket, io);
  game_loading(socket, io);
  tap_dot(socket, io);

  socket.emit("ONLINE_UPDATE", dbOnline.size);
  socket.emit("LOBBY_GET", getFreeLobbies());

  socket.on("SERVER_PING", (func) => {
    if (typeof func === "function") {
      func();
    }
  });
});

app.get("/", (req, res) => {
  res.send("Server online!");
});

const server = http.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
<<<<<<< HEAD
  console.log("Server started - " + PORT);
=======
  console.log("Server started - " + (PORT));
>>>>>>> 371f1c134b4dc45ddb62c8e6814a333f480133fe
});
