import { Logger } from "./logger";
import { queryByPanHash, queryByToken, updateCardData, insert } from "./dbUtil";
import { calculateHash } from "./panHashUtils";
import { kmsCryptoEncrypt, kmsCryptoDecrypt } from "./kmsUtils";
import { Client } from "pg";
import crypto from "crypto";

const logger = Logger;

export async function performTokenize(
  currentClient: Client,
  pan: string,
  mm?: string,
  yyyy?: string,
  name?: string
) {
  const panHash = calculateHash(pan);
  logger.info(`panHash: ${panHash}`);

  const existingRecords = await queryByPanHash(currentClient, panHash);
  logger.info(`existingRecords: ${existingRecords}`);
  const token = await getToken(
    currentClient,
    existingRecords,
    pan,
    mm,
    yyyy,
    name
  );
  if (token) {
    logger.info(`existing token: ${token}`);
    return token;
  }

  return await createToken(currentClient, panHash, pan, mm, yyyy, name);
}

export async function performDetokenize(currentClient: Client, token: string) {
  const record = await queryByToken(currentClient, token);
  if (!record) {
    throw new Error("No record found");
  }
  const cardData = await kmsCryptoDecrypt(record.encrypted_card_data);
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
async function getToken(
  currentClient: Client,
  records: any,
  pan: string,
  mm?: string,
  yyyy?: string,
  name?: string
) {
  if (records.length === 0) {
    logger.info("No existing record found");
    return null;
  }
  for (const record of records) {
    const cardData = await kmsCryptoDecrypt(record.encrypted_card_data);
    if (!cardData) {
      throw new Error("Failed to decrypt card data");
    }

    // Check if the pan matches
    if (cardData.cc !== pan) {
      continue;
    }

    logger.info("Found matching record with same pan");

    // If mm, yyyy, or name didn't match, update the card data
    if (
      cardData.mm !== mm ||
      cardData.yyyy !== yyyy ||
      cardData.name !== name
    ) {
      const encryptedCardData = await kmsCryptoEncrypt(pan, mm, yyyy, name);
      const updateResult = await updateCardData(
        currentClient,
        calculateHash(pan),
        encryptedCardData
      );
      if (!updateResult) {
        throw new Error("Failed to update card data");
      }
    }

    // Return the token of the matching record
    return record.token;
  }

  return null;
}

async function createToken(
  currentClient: Client,
  panHash: string,
  pan: string,
  mm?: string,
  yyyy?: string,
  name?: string
) {
  const encryptedCardData = await kmsCryptoEncrypt(pan, mm, yyyy, name);
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
    insertResult = await insert(
      currentClient,
      panHash,
      token,
      encryptedCardData
    );
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
  return crypto.randomUUID();
}

export function validateTokenizePanInput(pan: string) {
  if (!pan || pan.length < 14 || pan.length > 16 || typeof pan !== "string") {
    throw new Error("Invalid input for PAN");
  }
}
export function validateTokenizeInput(mm: string, yyyy: string) {
  if (!mm || Number(mm) < 0 || Number(mm) > 12 || typeof mm !== "string") {
    throw new Error("Invalid input for mm");
  }

  if (
    !yyyy ||
    Number(yyyy) < 2010 ||
    Number(yyyy) > 3000 ||
    typeof yyyy !== "string"
  ) {
    throw new Error("Invalid input for yyyy");
  }
  // Check if the card is expired
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns month index starting from 0
  if (
    Number(yyyy) < currentYear ||
    (Number(yyyy) === currentYear && Number(mm) < currentMonth)
  ) {
    throw new Error("The card is expired");
  }
}

export function validateDetokenizeInput(token: string) {
  if (!token || token.length !== crypto.randomUUID().length) {
    throw new Error("Invalid input for token");
  }
}
