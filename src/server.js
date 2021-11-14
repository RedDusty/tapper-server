const express = require("express");

const app = express();

require("dotenv").config();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log("Server started - " + PORT);
});

app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_DOMAIN_FIRST,
    process.env.CLIENT_DOMAIN_SECOND,
    process.env.CLIENT_DOMAIN_THIRD,
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  return next();
});

app.get("checker", (req, res) => {
  res.status(200).json({ message: "online" });
});

app.get("data", (req, res) => {
  res.status(200).json({
    message: "connected",
    online: dbOnline.size + 1,
    lobbies: getFreeLobbies(),
  });
});

/** @type {socketio} */
const io = require("socket.io")(server, {
  cors: true,
  origin: process.env.DEPLOY_APP,
  pingInterval: 5000,
});

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
const user_logout = require('./events/user_logout');

io.on("connection", (/** @type {socketio.Socket} socket*/ socket) => {
  console.log(socket.id + " is connected");
  socket.send(socket.id);

  user_login(socket, io);
  user_logout(socket, io);
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

  socket.on("SERVER_PING", (func) => {
    if (typeof func === "function") {
      func();
    }
  });
});
