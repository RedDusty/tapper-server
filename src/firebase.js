const firestore = require("../fbConfig").firestore;
const { doc, getDoc, updateDoc, setDoc, collection, getDocs, query, orderBy, limit } = require("firebase/firestore");
require("dotenv").config();

/**
 *
 * @param {string} userUID
 * @param {number} score
 */
exports.userScoreAdd = async function userScoreAdd(userUID, score) {
  const docRef = doc(firestore, "users", userUID);

  const userDoc = await getDoc(docRef);

  let userScore = await userDoc.data().score;

  userScore += score;

  await updateDoc(docRef, {
    score: userScore,
    key: process.env.DB_ACCESS_KEY,
  });
};

/**
 *
 * @param {string} userUID
 * @param {number} score
 */
exports.userScoreDecrease = async function userScoreDecrease(userUID, score) {
  const docRef = doc(firestore, "users", userUID);

  const userDoc = await getDoc(docRef);

  let userScore = await userDoc.data().score;

  if (score > 0) {
    userScore -= score;
  } else {
    userScore += score;
  }

  await updateDoc(docRef, {
    score: userScore,
    key: process.env.DB_ACCESS_KEY,
  });
};

/**
 * @typedef {Object} skinType
 * @property {"standard"} type
 * @property {string} color
 * @property {boolean} withBorder
 * @property {string} borderColor
 * @property {"solid" | "dashed" | "dotted" | "double"} borderStyle
 * @property {number} borderWidth
 *
 * @typedef {Object} userInfoType
 * @property {string} nickname
 * @property {string} avatar
 * @property {number} score
 * @property {string} uid
 * @property {skinType} skin
 *
 * @param {string} userUID
 * @typedef {Object} botType
 * @property {boolean} isTurned
 * @property {"easy"| "medium"| "hard"| "extreme"| "tapper"| "cheater-1"| "cheater-2"| "cheater-3"| "custom"} difficulty
 * @property {number} speed
 *
 * @typedef {Object} fieldType
 * @property {number} fieldX
 * @property {number} fieldY
 *
 * @typedef {Object} dotsType
 * @property {userInfoType} user
 * @property {number} index
 * @property {number} time
 *
 * @typedef {Object} scoreType
 * @property {userInfoType} user
 * @property {number} score
 * @property {"add" | "decrease"} scoreChange
 *
 * @typedef {Object} gameType
 * @property {botType} bot
 * @property {fieldType} field
 * @property {Object} score
 * @property {Array<scoreType>} score.addScore
 * @property {Array<scoreType>} score.decreaseScore
 * @property {number} timeStart
 * @property {number} timeEnd
 * @property {Array<dotsType>} dots
 * @property {Array<userInfoType>} users
 */

/**
 * @param {string} userUID
 * @param {gameType} game
 */
exports.userGameAdd = async function userGameAdd(userUID, game) {
  const docRef = doc(
    firestore,
    "users",
    userUID,
    "userGames",
    String(Date.now())
  );

  game.users.forEach((user, userIdx) => {
    game.dots.forEach((dot) => {
      if (dot.user.uid === user.uid) {
        dot.user = userIdx;
      }
    });
  });

  game.users.forEach((user, userIdx) => {
    game.score.addScore.forEach((score) => {
      if (score.user.uid === user.uid) {
        score.user = userIdx;
      }
    });
  });

  game.users.forEach((user, userIdx) => {
    game.score.decreaseScore.forEach((score) => {
      if (score.user.uid === user.uid) {
        score.user = userIdx;
      }
    });
  });

  const removeUnusedField = (obj, propertyToRemove) => {
    for (let prop in obj) {
      if (prop === propertyToRemove) delete obj[prop];
      else if (typeof obj[prop] === "object")
        removeUnusedField(obj[prop], propertyToRemove);
    }

    return obj;
  };

  removeUnusedField(game, "banned");
  removeUnusedField(game, "firstLogin");
  removeUnusedField(game, "id");
  removeUnusedField(game, "isLoaded");

  await setDoc(docRef, { ...game, key: process.env.DB_ACCESS_KEY });
};

/**
 *
 * @param {string} userUID
 * @param {object} skin
 * @param {string} skin.type
 * @param {string} skin.color
 * @param {boolean} skin.withBorder
 * @param {string} skin.borderColor
 * @param {string} skin.borderStyle
 * @param {number} skin.borderWidth
 */
exports.userSkinChange = async function userSkinChange(userUID, skin) {
  const docRef = doc(firestore, "users", userUID);

  await updateDoc(docRef, {
    skin: skin,
    key: process.env.DB_ACCESS_KEY,
  });
};

exports.userGetUserGames = async function userGetUserGames(userUID) {
  const colRef = collection(firestore, "users", userUID, 'userGames');

  const q = query(colRef, orderBy("timeStart", "desc"), limit(15))

  const docs = await getDocs(q)

  const userGames = []

  docs.forEach((doc) => {
    userGames.push(doc.data())
  })

  return userGames
}