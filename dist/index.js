"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.js
const express_1 = __importDefault(require("express"));
const tokenise_1 = require("./route/tokenise");
const detokenise_1 = require("./route/detokenise");
require("dotenv").config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const server = process.env.SERVER || "http://localhost";
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/tokenise", tokenise_1.tokeniseApi);
app.use("/detokenise", detokenise_1.detokeniseApi);
app.listen(port, () => {
    console.log(`[server]: Server is running at ${server}:${port}`);
});
