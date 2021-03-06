const { dbLobby, dbOnline, dbGames } = require("./db");
const {
  userScoreDecrease,
  userScoreAdd,
  userGameAdd,
} = require("./firebase");

function getFreeLobbies() {
  const lobbyListPublic = new Map(
    [...dbLobby].filter(([k, v]) => v.visibility === "public")
  );

  const lobbyListNotFull = new Map(
    [...lobbyListPublic].filter(([k, v]) => v.inLobbyPlayers < v.maxPlayers)
  );

  const lobbyListArray = [...lobbyListNotFull].map((lobby) => {
    if (lobby[1] && lobby[1].users && lobby[1].users[0]) {
      const data = lobby[1];
      return {
        ownerUID: data.ownerUID,
        avatar: lobby[1].users[0].avatar,
        nickname: data.nickname,
        inLobbyPlayers: data.inLobbyPlayers,
        maxPlayers: data.maxPlayers,
        fieldX: data.fieldX,
        fieldY: data.fieldY,
        code: data.code,
        bot: data.bot,
      };
    }
  });

  return lobbyListArray;
}

function hostChangeOrDestroy(io, socketID, reason) {
  const disUser = [...dbOnline.values()].filter(
    (user) => user.id === socketID
  )[0];

  let isHost = false;

  if (disUser) {
    const ownLobby = [...dbLobby.values()].filter(
      (lobby) => lobby.ownerUID === disUser.uid
    )[0];
    if (ownLobby) {
      if (ownLobby.visibility !== "game") {
        if (ownLobby.users.length <= 1) {
          dbLobby.delete(ownLobby.code);
          console.log(
            `Lobby ${ownLobby.code} has been destroyed. Owner: ${ownLobby.ownerUID} | ${disUser.nickname} | ${disUser.uid}. Reason: ${reason}`
          );
        } else {
          isHost = true;
          ownLobby.users.splice(0, 1);
          ownLobby.ownerUID = ownLobby.users[0].uid;
          ownLobby.nickname = ownLobby.users[0].nickname;
          ownLobby.inLobbyPlayers = String(ownLobby.users.length);
          ownLobby.messages.push({
            avatar: "system",
            id: "system",
            nickname: "System",
            uid: "system",
            message: `${disUser.nickname} disconnected. ${ownLobby.nickname} now is owner!`,
            time: Date.now(),
            code: ownLobby.code,
          });

          const usersRKey = removeKey(ownLobby.users);
          Object.assign(ownLobby, { users: usersRKey });

          io.in(`LOBBY_${ownLobby.code}`).emit(
            "LOBBY_GET_MESSAGES",
            ownLobby.messages
          );
          io.in(`LOBBY_${ownLobby.code}`).emit("LOBBY_USERS_UPDATE", {
            type: "hostChange",
            value: ownLobby.usersRKey,
            lobby: ownLobby,
          });
        }
      }
    }
  }

  return isHost;
}

function userLeave(io, socketID) {
  const disUser = [...dbOnline.values()].filter(
    (user) => user.id === socketID
  )[0];

  if (disUser) {
    const disLobby = [...dbLobby.values()].filter((lobby) => {
      const findUser = lobby.users.filter((user) => disUser.uid === user.uid);
      if (findUser.length > 0) {
        return findUser[0].uid === disUser.uid;
      }
    });

    if (disLobby) {
      if (disLobby.length > 0 && disLobby[0].visibility !== "game") {
        const userIndex = disLobby[0].users.findIndex(
          (user) => user.uid === disUser.uid
        );
        disLobby[0].users.splice(userIndex, 1);
        disLobby[0].inLobbyPlayers = String(disLobby[0].users.length);
        disLobby[0].messages.push({
          avatar: "system",
          id: "system",
          nickname: "System",
          uid: "system",
          message: `${disUser.nickname} disconnected`,
          time: Date.now(),
          code: disLobby[0].code,
        });

        const usersRKey = removeKey(disLobby[0].users);
        Object.assign(disLobby[0], { users: usersRKey });

        io.in(`LOBBY_${disLobby[0].code}`).emit(
          "LOBBY_GET_MESSAGES",
          disLobby[0].messages
        );
        io.in(`LOBBY_${disLobby[0].code}`).emit("LOBBY_USERS_UPDATE", {
          type: "userLeave",
          value: disLobby[0].users,
          lobby: disLobby[0],
        });
      } else if (disLobby.length > 0 && disLobby[0].visibility === "game") {
        const userIndex = disLobby[0].users.findIndex(
          (user) => user.id === socketID
        );

        dbLobby.get(disLobby[0].code).users[userIndex].isLeft = true;
        dbLobby.get(disLobby[0].code).users[userIndex].isLoaded = true;

        if (isAllUsersLeft(disLobby[0].code)) {
          console.log(
            `Lobby ${disLobby[0].code} has been destroyed. Owner: ${disLobby[0].ownerUID} | ${disLobby[0].nickname} | ${disLobby[0].uid}. Reason: All users left`
          );
          destroyLobbyAndGame(disLobby[0].code);
          return 0;
        }

        const usersRKey = removeKey(dbLobby.get(disLobby[0].code)).users;

        io.in(`LOBBY_${disLobby[0].code}`).emit(
          "USER_LOADED_RETURN",
          usersRKey
        );

        if (isAllUsersLoaded(disLobby[0].code)) {
          io.in(`LOBBY_${disLobby[0].code}`).emit("GAME_LOADED", true);
          if (disLobby[0].bot.isTurned) {
            setTimeout(() => {
              const field =
                Number(disLobby[0].fieldX) * Number(disLobby[0].fieldY);
              botTap(
                disLobby[0].code,
                field,
                disLobby[0].bot.difficulty,
                disLobby[0].bot.speed
              );
            }, 5000);
          }
        }
      }
    }
  }
}

function isAllUsersLeft(code) {
  let pass = false;
  if (
    dbLobby.get(code).users.filter((e) => e.isLeft === true).length ===
    dbLobby.get(code).users.length
  ) {
    pass = true;
  }
  return pass;
}

function isAllUsersLoaded(code) {
  let pass = false;
  if (
    dbLobby.get(code).users.filter((e) => e.isLoaded === true).length ===
    dbLobby.get(code).users.length
  ) {
    pass = true;
  }
  return pass;
}

function destroyLobbyAndGame(code) {
  dbLobby.delete(code);
  dbGames.delete(code);
}

function removeKey(obj) {
  for (let prop in obj) {
    if (prop === "key") delete obj[prop];
    else if (typeof obj[prop] === "object") removeKey(obj[prop]);
  }

  return obj;
}

function getBotConfig() {
  return {
    nickname: "Bot",
    avatar: "system",
    score: 0,
    firstLogin: 0,
    uid: "system",
    id: "system",
    isLoaded: true,
    key: "system",
    skin: {
      type: "standard",
      withBorder: true,
      borderColor: "gray-500",
      borderStyle: "double",
      borderWidth: 8,
      color: "black",
    },
    banned: false,
    isLeft: false,
  };
}

function botTap(io, socket, code, field, difficulty, speed) {
  if (dbGames.has(code)) {
    const hard = () => {
      if (difficulty === "custom") return Number(speed || 6);
      if (difficulty === "cheater-3") return 30;
      if (difficulty === "cheater-2") return 27;
      if (difficulty === "cheater-1") return 24;
      if (difficulty === "tapper") return 21;
      if (difficulty === "extreme") return 18;
      if (difficulty === "hard") return 8;
      if (difficulty === "medium") return 6;
      if (difficulty === "easy") return 4;
      return 6;
    };
    if (dbGames.has(code)) {
      const rand =
        Math.random() * (6000 / hard() - 3000 / hard() + 1) +
        3000 / hard() +
        200 / (hard() / 10);
      setTimeout(() => {
        if (dbGames.has(code)) {
          const freeIndexes = dbGames
            .get(code)
            .dots.filter((dot) => dot.user === undefined);
          const dotPlace =
            freeIndexes[
              Math.floor(Math.random() * (freeIndexes.length - 0) + 0)
            ];
          botTap(io, socket, code, field, difficulty, speed);

          dotTap(io, socket, dotPlace.index, code, getBotConfig());
        }
      }, rand);
    }
  }
}

function dotTap(io, socket, dotIndex, code, user) {
  const userData = removeKey(user);

  const game = dbGames.get(code);

  if (!dbGames.has(code)) {
    return 0;
  }

  if (game.dots[dotIndex].user === undefined) {
    game.dots[dotIndex].user = userData;

    game["userGameDots"].push({
      user: removeKey(user),
      index: dotIndex,
      time: Date.now(),
    });

    io.in(`LOBBY_${code}`).emit("GAME_TAP", game.dots[dotIndex]);
  }

  if (game.dots.filter((dot) => dot.user === undefined).length === 0) {
    const lobby = dbLobby.get(code);

    const userGame = {
      bot: {
        isTurned: lobby.bot.isTurned,
        difficulty: lobby.bot.difficulty,
        speed: lobby.bot.speed,
      },
      field: {
        fieldX: lobby.fieldX,
        fieldY: lobby.fieldY,
      },
      score: {
        addScore: [],
        decreaseScore: [],
      },
      users: removeKey(lobby.users),
      timeStart: game.time.start,
      timeEnd: Date.now(),
      dots: game.userGameDots,
    };

    const hasBot = lobby.users.filter((user) => user.id === "system");
    if (lobby.users.length > 1 && hasBot.length === 0) {
      const usersByScore = lobby.users
        .slice(0)
        .sort((userA, userB) => userA.score - userB.score);
      const usersDots = [];
      lobby.users.forEach((user) => {
        const dots = dbGames
          .get(code)
          .dots.filter((dot) => dot.user.uid === user.uid).length;
        usersDots.push({ user: user, dots: dots });
      });
      const usersByDots = usersDots
        .slice(0)
        .sort((userA, userB) => userA.dots - userB.dots);

      const minusScore = usersByDots.slice(
        0,
        Math.ceil(usersByDots.length / 2)
      );
      const plusScore = usersByDots.slice(Math.ceil(usersByDots.length / 2));

      minusScore.forEach((uData, index) => {
        const scoreIndex = usersByScore.findIndex(
          (u) => u.id === uData.user.id
        );
        const dotsIndex = usersByDots.findIndex(
          (u) => u.user.id === uData.user.id
        );
        minusScore[index] = {
          user: uData.user,
          dots: uData.dots,
          score: 0 - scoreIndex - dotsIndex - 1,
        };
      });

      plusScore.forEach((uData, index) => {
        const scoreIndex = usersByScore
          .slice(0)
          .reverse()
          .findIndex((u) => u.id === uData.user.id);
        const dotsIndex = usersByDots.findIndex(
          (u) => u.user.id === uData.user.id
        );
        plusScore[index] = {
          user: uData.user,
          dots: uData.dots,
          score: 0 + scoreIndex + dotsIndex + 1,
        };
      });

      minusScore.forEach((dUser) => {
        if (dUser.user.id !== "system") {
          userScoreDecrease(dUser.user.uid, dUser.score);
        }
      });
      plusScore.forEach((aUser) => {
        if (aUser.user.id !== "system") {
          userScoreAdd(aUser.user.uid, aUser.score);
        }
      });

      const decreasedScores = removeKey(minusScore);
      const addedScores = removeKey(plusScore);

      userGame.score.decreaseScore = decreasedScores.slice(0);
      userGame.score.addScore = addedScores.slice(0);

      const gameData = {
        dots: game.dots,
        time: {
          start: game.time.start,
          end: Date.now(),
        },
        addScore: addedScores,
        decreaseScore: decreasedScores,
      };

      io.in(`LOBBY_${code}`).emit("GAME_END_SCORE", gameData);

      lobby.users.forEach((lUser) => {
        if (lUser.uid !== "system") {
          userGameAdd(lUser.uid, userGame);
        }
      });
    } else {
      const gameData = {
        dots: game.dots,
        time: {
          start: game.time.start,
          end: Date.now(),
        },
      };

      lobby.users.forEach((user) => {
        if (user.uid !== "system") {
          userGameAdd(user.uid, userGame);
        }
      });

      io.in(`LOBBY_${code}`).emit("GAME_END", gameData);
    }

    console.log(
      `Lobby ${lobby.code} has been destroyed. Owner: ${lobby.ownerUID} | ${lobby.nickname} | ${lobby.uid}. Reason: The game is over.`
    );
    destroyLobbyAndGame(lobby.code);
  }
}

exports.dotTap = dotTap;
exports.botTap = botTap;
exports.getBotConfig = getBotConfig;
exports.destroyLobbyAndGame = destroyLobbyAndGame;
exports.userLeave = userLeave;
exports.hostChangeOrDestroy = hostChangeOrDestroy;
exports.getFreeLobbies = getFreeLobbies;
exports.removeKey = removeKey;
exports.isAllUsersLeft = isAllUsersLeft;
exports.isAllUsersLoaded = isAllUsersLoaded;
