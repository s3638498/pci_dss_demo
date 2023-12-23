"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detokenise = void 0;
const tokeniseUtil_1 = require("../util/tokeniseUtil");
const dbUtil_1 = require("../util/dbUtil");
const logger_1 = require("./../util/logger");
const logger = logger_1.Logger;
const detokenise = async (req, res) => {
    logger.info("~~detokenize~~");
    const token = req.body.token;
    try {
        (0, tokeniseUtil_1.validateDetokenizeInput)(token);
    }
    catch (e) {
        res.status(400).send({ error: `${e}` });
        return;
    }
    const client = await (0, dbUtil_1.startTokenServer)();
    if (!client) {
        res.status(500).send({ error: "Unable to connect to DB" });
        return;
    }
    try {
        const result = await (0, tokeniseUtil_1.performDetokenize)(client, token);
        if (!result) {
            throw new Error("No result");
        }
        res.status(200).send(result);
    }
    catch (e) {
        res.status(500).send({ error: `${e}` });
    }
    (0, dbUtil_1.endTokenServer)(client);
};
exports.detokenise = detokenise;
