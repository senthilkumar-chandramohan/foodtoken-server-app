import firebaseAdmin from "firebase-admin";

// Initialize Firebase Admin SDK
// const serviceAccount = require("./serviceAccountKey.json");
const serviceAccountKey = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').replace(/nl/g, "");
const serviceAccount = JSON.parse(serviceAccountKey);
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

export {
    firebaseAdmin,
};
