"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detokeniseApi = void 0;
const express_1 = __importDefault(require("express"));
const detokenise_1 = require("./../components/detokenise");
exports.detokeniseApi = express_1.default.Router();
exports.detokeniseApi.post("/", (req, res) => {
    (0, detokenise_1.detokenise)(req, res);
});
