"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokeniseApi = void 0;
const express_1 = __importDefault(require("express"));
const tokenise_1 = require("./../components/tokenise");
exports.tokeniseApi = express_1.default.Router();
exports.tokeniseApi.post("/", (req, res) => {
    (0, tokenise_1.tokenize)(req, res);
});
