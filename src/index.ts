import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes/index";
import dotenv from "dotenv";
import middleware from "./middleware";

import "./modules/txn-listener";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://localhost:3000","https://foodtoken-web.vercel.app"]
}));

app.use(middleware.decodeToken);

// Use routes
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
