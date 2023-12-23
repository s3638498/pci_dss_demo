"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = void 0;
const tokeniseUtil_1 = require("../util/tokeniseUtil");
const dbUtil_1 = require("../util/dbUtil");
const logger_1 = require("./../util/logger");
const logger = logger_1.Logger;
const tokenize = async (req, res) => {
    logger.info("~~tokenize~~");
    if (!req || !req.body) {
        res.status(400).send({ error: `no request is given` });
        return;
    }
    const { pan, mm, yyyy, name } = req.body;
    try {
        (0, tokeniseUtil_1.validateTokenizePanInput)(pan);
        if (mm && yyyy) {
            (0, tokeniseUtil_1.validateTokenizeInput)(mm, yyyy);
        }
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
        const token = await (0, tokeniseUtil_1.performTokenize)(client, pan, mm, yyyy, name);
        res.status(200).send({ token: token });
        return;
    }
    catch (e) {
        res.status(500).send({ error: `${e}` });
    }
    (0, dbUtil_1.endTokenServer)(client);
};
exports.tokenize = tokenize;
