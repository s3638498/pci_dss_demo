"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHash = void 0;
const crypto = require("crypto");
const PAN_PADDING = "891191";
function calculateHash(pan) {
    //write code to calculate pan sha256 hash
    return crypto
        .createHash("sha256")
        .update(PAN_PADDING + pan)
        .digest("hex")
        .toLowerCase();
}
exports.calculateHash = calculateHash;
