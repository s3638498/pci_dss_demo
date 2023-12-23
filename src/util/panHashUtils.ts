const crypto = require("crypto");

const PAN_PADDING = "891191";
export function calculateHash(pan: string) {
  //write code to calculate pan sha256 hash
  return crypto
    .createHash("sha256")
    .update(PAN_PADDING + pan)
    .digest("hex")
    .toLowerCase();
}
