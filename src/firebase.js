const firestore = require("../fbConfig").firestore;
const { doc, getDoc, updateDoc } = require("firebase/firestore");

async function userKeyGet(userUID) {
  const docRef = doc(firestore, "users", userUID);

  const userDoc = await getDoc(docRef);

  const userKey = await userDoc.data().key;

  return userKey;
}

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

  const key = await userKeyGet(userUID);

  await updateDoc(docRef, {
    score: userScore,
    key,
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
    userScore += score
  }

  const key = await userKeyGet(userUID);

  await updateDoc(docRef, {
    score: userScore,
    key,
  });
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

  const userDoc = await getDoc(docRef);

  await updateDoc(docRef, {
    skin: skin,
  });
};
