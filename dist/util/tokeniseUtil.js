"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDetokenizeInput = exports.validateTokenizeInput = exports.validateTokenizePanInput = exports.performDetokenize = exports.performTokenize = void 0;
const logger_1 = require("./logger");
const dbUtil_1 = require("./dbUtil");
const panHashUtils_1 = require("./panHashUtils");
const kmsUtils_1 = require("./kmsUtils");
const crypto_1 = __importDefault(require("crypto"));
const logger = logger_1.Logger;
async function performTokenize(currentClient, pan, mm, yyyy, name) {
    const panHash = (0, panHashUtils_1.calculateHash)(pan);
    logger.info(`panHash: ${panHash}`);
    const existingRecords = await (0, dbUtil_1.queryByPanHash)(currentClient, panHash);
    logger.info(`existingRecords: ${existingRecords}`);
    const token = await getToken(currentClient, existingRecords, pan, mm, yyyy, name);
    if (token) {
        logger.info(`existing token: ${token}`);
        return token;
    }
    return await createToken(currentClient, panHash, pan, mm, yyyy, name);
}
exports.performTokenize = performTokenize;
async function performDetokenize(currentClient, token) {
    const record = await (0, dbUtil_1.queryByToken)(currentClient, token);
    if (!record) {
        throw new Error("No record found");
    }
    const cardData = await (0, kmsUtils_1.kmsCryptoDecrypt)(record.encrypted_card_data);
    if (!cardData) {
        throw new Error("Failed to decrypt card data");
    }
    return {
        pan: cardData.cc,
        mm: cardData.mm,
        yyyy: cardData.yyyy,
        name: cardData.name,
    };
}
exports.performDetokenize = performDetokenize;
async function getToken(currentClient, records, pan, mm, yyyy, name) {
    if (records.length === 0) {
        logger.info("No existing record found");
        return null;
    }
    for (const record of records) {
        const cardData = await (0, kmsUtils_1.kmsCryptoDecrypt)(record.encrypted_card_data);
        if (!cardData) {
            throw new Error("Failed to decrypt card data");
        }
        // Check if the pan matches
        if (cardData.cc !== pan) {
            continue;
        }
        logger.info("Found matching record with same pan");
        // If mm, yyyy, or name didn't match, update the card data
        if (cardData.mm !== mm ||
            cardData.yyyy !== yyyy ||
            cardData.name !== name) {
            const encryptedCardData = await (0, kmsUtils_1.kmsCryptoEncrypt)(pan, mm, yyyy, name);
            const updateResult = await (0, dbUtil_1.updateCardData)(currentClient, (0, panHashUtils_1.calculateHash)(pan), encryptedCardData);
            if (!updateResult) {
                throw new Error("Failed to update card data");
            }
        }
        // Return the token of the matching record
        return record.token;
    }
    return null;
}
async function createToken(currentClient, panHash, pan, mm, yyyy, name) {
    const encryptedCardData = await (0, kmsUtils_1.kmsCryptoEncrypt)(pan, mm, yyyy, name);
    if (!encryptedCardData) {
        logger.error("Failed to encrypt card data");
        throw new Error("Failed to encrypt card data");
    }
    const token = generateToken();
    logger.info(`generate token: ${token}`);
    //try 3 times to insert
    let insertResult = false;
    const TRIES = 3;
    for (let i = 0; i < TRIES; i++) {
        insertResult = await (0, dbUtil_1.insert)(currentClient, panHash, token, encryptedCardData);
        if (insertResult) {
            break;
        }
    }
    if (!insertResult) {
        throw new Error("Failed to insert record");
    }
    return token;
}
function generateToken() {
    // 36 character long v4 UUID
    return crypto_1.default.randomUUID();
}
function validateTokenizePanInput(pan) {
    if (!pan || pan.length < 14 || pan.length > 16 || typeof pan !== "string") {
        throw new Error("Invalid input for PAN");
    }
}
exports.validateTokenizePanInput = validateTokenizePanInput;
function validateTokenizeInput(mm, yyyy) {
    if (!mm || Number(mm) < 0 || Number(mm) > 12 || typeof mm !== "string") {
        throw new Error("Invalid input for mm");
    }
    if (!yyyy ||
        Number(yyyy) < 2010 ||
        Number(yyyy) > 3000 ||
        typeof yyyy !== "string") {
        throw new Error("Invalid input for yyyy");
    }
    // Check if the card is expired
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth() returns month index starting from 0
    if (Number(yyyy) < currentYear ||
        (Number(yyyy) === currentYear && Number(mm) < currentMonth)) {
        throw new Error("The card is expired");
    }
}
exports.validateTokenizeInput = validateTokenizeInput;
function validateDetokenizeInput(token) {
    if (!token || token.length !== crypto_1.default.randomUUID().length) {
        throw new Error("Invalid input for token");
    }
}
exports.validateDetokenizeInput = validateDetokenizeInput;
