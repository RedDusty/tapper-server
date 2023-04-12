const express = require("express");
const cors = require("cors")

const app = express();

const DEPLOY_APP = process.env.DEPLOY_APP;

app.use(cors({
  origin: [
    "https://" + DEPLOY_APP,
    "https://" + DEPLOY_APP + "/",
    DEPLOY_APP,
    DEPLOY_APP + "/",
  ],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE']
}))

const { dbOnline, globalChat } = require("./db");
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
    "https://" + DEPLOY_APP,
    "https://" + DEPLOY_APP + "/",
    DEPLOY_APP,
    DEPLOY_APP + "/",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    console.log('a');
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", true);
  return next();
});

app.get("/checker", (req, res) => {
  res.status(200).json({ message: "online" });
});

app.get("/data", (req, res) => {
  res.status(200).json({
    message: "connected",
    online: dbOnline.size + 1,
    lobbies: getFreeLobbies(),
    messages: globalChat
  });
});

/** @type {socketio} */
const io = require("socket.io")(server, {
  cors: true,
  origin: process.env.DEPLOY_APP,
  pingInterval: 5000,
});


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
const user_logout = require("./events/user_logout");
const user_games_list = require("./events/user_games_list");
const global_chat_messenger = require('./events/global/global_chat_messenger');
io.on("connection", (/** @type {socketio.Socket} socket*/ socket) => {
  console.log(socket.id + " is connected");
  socket.send(socket.id);

  global_chat_messenger(socket, io)
  user_games_list(socket, io)
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
