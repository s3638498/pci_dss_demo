import { Logger } from "./logger";
import KMS from "@google-cloud/kms";
require("dotenv").config();
const kms = new KMS.v1.KeyManagementServiceClient();
const PROJECT_ID = process.env.PROJECT_ID || "";
const KMS_LOCATION = process.env.KMS_LOCATION || "";
const KMS_KEY_RING = process.env.KMS_KEY_RING || "";
const KMS_KEY_NAME = process.env.KMS_KEY_NAME || "";
if (!PROJECT_ID || !KMS_LOCATION || !KMS_KEY_RING || !KMS_KEY_NAME) {
  throw new Error("Missing environment variables");
}
const KMS_KEY_DEF = kms.cryptoKeyPath(
  PROJECT_ID,
  KMS_LOCATION,
  KMS_KEY_RING,
  KMS_KEY_NAME
);
const DELIMITER = "<DELIMITER>";

const logger = Logger;

/// ////////////////////  KMS KMS KMS ///////////////////////
/**
 * Accepts the following params as an HTTP POST:
 *  project_id - The project ID associated with the auth_token
 *  cc         - 14-16 digit credit card number
 *  mm         - 2 digit month
 *  yyyy       - 4 digit year
 *  user_id     - arbitrary user ID string (optional)
 *
 * Returns an alphanumeric string which can be used as a PCI DSS compliant token
 * in-place of a credit card number in out-of-scope data storage environments.
 *
 * @param {object} req - tokenizer request object
 * @param {object} res - tokenizer response object
 */
export async function kmsCryptoEncrypt(
  cc: string,
  mm?: string,
  yyyy?: string,
  name?: string
) {
  try {
    let plaintext = `${cc}`;
    if (mm && yyyy) {
      plaintext = plaintext.concat(`${DELIMITER}${mm}${DELIMITER}${yyyy}`);
    }
    if (name) {
      plaintext = plaintext.concat(`${DELIMITER}${name}`);
    }
    // Encrypts the file using the specified crypto key
    const buffText = Buffer.from(`${plaintext}`, "utf8");
    const [result] = await kms.encrypt({
      name: KMS_KEY_DEF,
      plaintext: buffText,
    });
    logger.info(`result: ${result.ciphertext}`);
    if (!result || !result.ciphertext || result.ciphertext === "") {
      throw new Error("Failed to encrypt");
    }
    const buffer = <Buffer>result.ciphertext;
    const token = buffer.toString("base64");
    logger.info(`token: ${token}`);
    return token;
  } catch (err) {
    logger.error(err);
    return null;
  }
}

/**
 * Accepts the following params as an HTTP POST:
 *  project_id - The project ID associated with the auth_token
 *  token   - The tokenized CC number
 *  user_id     - arbitrary user ID string (optional)
 *
 * If the auth_token was valid, this returns a JSON object containing the
 * sensitive payment card data that was stored under the given token.
 *
 */
export async function kmsCryptoDecrypt(ccToken: string) {
  try {
    logger.info("kmsCryptoDecrypt with token: " + ccToken);
    const ciphertext = Buffer.from(ccToken, "base64");
    const name = KMS_KEY_DEF;
    const [result] = await kms.decrypt({ name, ciphertext });

    const rawDetok = Buffer.from(`${result.plaintext}`, "utf8").toString();

    if (!result || !rawDetok || rawDetok === "") {
      return null;
    }

    const detok = rawDetok.split(DELIMITER);
    if (!detok) {
      logger.error("Failed to parse detokenized data");
      return null;
    }
    switch (detok.length) {
      case 1:
        return { cc: detok[0] };
      case 2:
        return { cc: detok[0], name: detok[1] };
      case 3:
        return { cc: detok[0], mm: detok[1], yyyy: detok[2] };
      case 4:
        return { cc: detok[0], mm: detok[1], yyyy: detok[2], name: detok[3] };
      default:
        throw new Error("Invalid detok length");
    }
  } catch (err) {
    logger.error(err);
  }
  return null;
}
