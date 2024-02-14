import firebaseAdmin from "firebase-admin";

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

export {
    firebaseAdmin,
};
