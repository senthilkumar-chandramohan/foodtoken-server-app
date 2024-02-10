import express from "express";
// import firebaseAdmin from "firebase-admin";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes/index";
import dotenv from "dotenv";

import "./modules/txn-listener";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: ["https://localhost:3000","https://foodtoken-web.vercel.app"]
}));

// Initialize Firebase Admin SDK
// const serviceAccount = require("path/to/your/firebase/serviceAccountKey.json");
// firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(serviceAccount),
//   // Add any other Firebase configurations as needed
// });

// Use routes
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
