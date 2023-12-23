// src/index.js
import express, { Express } from "express";
import { tokeniseApi } from "./route/tokenise";
import { detokeniseApi } from "./route/detokenise";

require("dotenv").config();

const app: Express = express();
const port = process.env.PORT || 3000;
const server = process.env.SERVER || "http://localhost";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/tokenise", tokeniseApi);
app.use("/detokenise", detokeniseApi);

app.listen(port, () => {
  console.log(`[server]: Server is running at ${server}:${port}`);
});
