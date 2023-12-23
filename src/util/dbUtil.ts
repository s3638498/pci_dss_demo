import { Client } from "pg";
import { Logger } from "./logger";

const logger = Logger;

const config = {
  user: "<REDACTED>",
  host: "<REDACTED>",
  database: "<REDACTED>",
  password: "<REDACTED>",
  port: 5432,
};

export async function startTokenServer() {
  const client = new Client(config);
  try {
    await client.connect();
    logger.info("Connection to DB established");
  } catch (err) {
    logger.error(err);
  }
  return client;
}

export async function endTokenServer(currentClient: Client) {
  try {
    await currentClient.end();
    logger.info("Connection to DB closed");
  } catch (err) {
    logger.error(err);
  }
}

export async function queryByToken(currentClient: Client, token: string) {
  const queryText = "SELECT * FROM payment WHERE token = $1 AND deleted = 0";
  try {
    const result = await currentClient.query(queryText, [token]);
    if (!result.rows) {
      logger.error(`No record found for token: ${token}`);
      return;
    } else if (result.rows.length != 1) {
      logger.error(`More than 1 record found for token: ${token}`);
      return;
    }
    logger.info("Query result for queryByToken:", result.rows.length);
    //token is unique, by right, will only have 1 record
    return result.rows[0];
  } catch (err) {
    logger.error(err);
    return;
  }
}

export async function queryByPanHash(currSess: Client, panHash: string) {
  const queryText = "SELECT * FROM payment WHERE pan_hash = $1";
  try {
    const result = await currSess.query(queryText, [panHash]);
    if (!result.rows) {
      logger.error(`No record found for hash: ${panHash}`);
      return;
    }
    logger.info("Query result for queryByPanHash:", result.rows.length);
    return result.rows;
  } catch (err) {
    logger.error(err);
    return;
  }
}

export async function updateCardData(
  currentClient: Client,
  panHash: string,
  encryptedCardData: string | null
) {
  if (!encryptedCardData || !panHash) {
    logger.error(`Missing encryptedCardData or panHash`);
    return false;
  }
  logger.info(`updating card data for panHash: ${panHash}`);
  try {
    const queryText = `UPDATE payment 
        SET encrypted_card_data = $1, updated_at = NOW() 
        WHERE pan_hash = $2
        RETURNING *`;
    const queryResult = await currentClient.query(queryText, [
      encryptedCardData,
      panHash,
    ]);
    logger.info(`successfully updated card data for panHash: ${panHash}`);
    return queryResult?.rowCount ? queryResult.rowCount > 0 : false;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

export async function insert(
  currentClient: Client,
  panHash: string,
  token: string,
  encryptedCardData: string
) {
  if (!encryptedCardData || !token || !panHash) {
    logger.error(`Missing encryptedCardData or token or panHash`);
    return false;
  }
  logger.info(`inserting card data for panHash: ${panHash}`);
  const queryText = `INSERT INTO payment (pan_hash, token, encrypted_card_data, updated_at, created_at, deleted) 
  VALUES ($1, $2, $3, NOW(), NOW(), 0)
  RETURNING encrypted_card_data`;
  try {
    const queryResult = await currentClient.query(queryText, [
      panHash,
      token,
      encryptedCardData,
    ]);
    logger.info(`successfully inserted card data for panHash: ${panHash}`);
    return queryResult?.rowCount ? queryResult.rowCount > 0 : false;
  } catch (err) {
    logger.error(err);
    return false;
  }
}
