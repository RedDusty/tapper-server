const { Socket } = require("socket.io");
const { dbLobby } = require("../../db");
const {
  getFreeLobbies,
  removeKey,
  hostChangeOrDestroy,
  destroyLobbyAndGame,
} = require("../../functions");

module.exports = function (/** @type {Socket} */ socket, io) {
  socket.on("LOBBY_USERS", (data) => {
    switch (data.action) {
      case "userJoin": {
        if (dbLobby.has(data.code)) {
          socket.leave("users");
          socket.join(`LOBBY_${data.code}`);
          const lobby = dbLobby.get(data.code);
          lobby.users.push(data.user);
          lobby.inLobbyPlayers = String(lobby.users.length);

          emmiter(
            socket,
            io,
            lobby,
            data.action,
            data.user.nickname,
            data.user.uid,
            data.user.id
          );
        }
        return 0;
      }
      case "userLeave": {
        if (dbLobby.has(data.code)) {
          socket.join("users");
          socket.leave(`LOBBY_${data.code}`);
          const lobby = dbLobby.get(data.code);
          lobby.users.forEach((user, index) => {
            if (user.id === socket.id) {
              lobby.users.splice(index, 1);
              lobby.inLobbyPlayers = String(lobby.users.length);

              return 0;
            }
          });

          hostChangeOrDestroy(io, socket.id, "User leave");

          if (lobby.users.length === 0) {
            destroyLobbyAndGame(data.code);
          }

          emmiter(
            socket,
            io,
            lobby,
            data.action,
            data.user.nickname,
            data.user.uid,
            data.user.id
          );
        }
        return 0;
      }
      case "userKick": {
        if (dbLobby.has(data.code)) {
          const lobby = dbLobby.get(data.code);
          lobby.users.forEach((user, index) => {
            if (user.id === data.user.id) {
              lobby.users.splice(index, 1);
              lobby.inLobbyPlayers = String(lobby.users.length);

              return 0;
            }
          });

          emmiter(
            socket,
            io,
            lobby,
            data.action,
            data.user.nickname,
            data.user.uid,
            data.user.id
          );
        }
        return 0;
      }
      case "userOwner": {
        if (dbLobby.has(data.code)) {
          const lobby = dbLobby.get(data.code);
          lobby.users.forEach((user, index) => {
            if (user.id === data.user.id) {
              const newOwnerUser = user;
              lobby.users.splice(index, 1);
              lobby.users.unshift(newOwnerUser);
              lobby.ownerUID = newOwnerUser.uid;
              lobby.nickname = newOwnerUser.nickname;

              return 0;
            }
          });

          emmiter(
            socket,
            io,
            lobby,
            data.action,
            data.user.nickname,
            data.user.uid,
            data.user.id
          );
        }
        return 0;
      }
      default:
        return 0;
    }
  });
};

/**
 *
 * @param {*} lobby
 * @param {"userLeave" | "userJoin" | "userKick" | "userOwner"} type
 */
function emmiter(socket, io, lobby, type, nickname, uid, id) {
  const message = () => {
    if (type === "userJoin") return "connected";
    if (type === "userLeave") return "disconnected";
    if (type === "userKick") return "was kicked";
    if (type === "userOwner") return "now is owner";
  };
  lobby.messages.push({
    avatar: "system",
    id: "system",
    nickname: "System",
    uid: "system",
    message: `${nickname} ${message()}`,
    time: Date.now(),
    code: lobby.code,
  });

  const lobbyListArray = getFreeLobbies();

  const usersRKey = removeKey(lobby.users);
  Object.assign(lobby, { users: usersRKey });

  io.in("users").emit("LOBBY_GET", lobbyListArray);
  io.in(`LOBBY_${lobby.code}`).emit("LOBBY_GET_MESSAGES", lobby.messages);
  io.in(`LOBBY_${lobby.code}`).emit("LOBBY_USERS_UPDATE", {
    type: type,
    value: lobby.users,
    lobby: lobby,
    uid: uid,
  });
  if (type === "userKick") {
    socket.broadcast.to(id).emit("LOBBY_KICK");
  }
}
