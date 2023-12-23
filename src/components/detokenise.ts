import {
  performDetokenize,
  validateDetokenizeInput,
} from "../util/tokeniseUtil";
import { endTokenServer, startTokenServer } from "../util/dbUtil";
import { Logger } from "./../util/logger";

const logger = Logger;

export const detokenise = async (req, res) => {
  logger.info("~~detokenize~~");

  const token = req.body.token;

  try {
    validateDetokenizeInput(token);
  } catch (e) {
    res.status(400).send({ error: `${e}` });
    return;
  }

  const client = await startTokenServer();
  if (!client) {
    res.status(500).send({ error: "Unable to connect to DB" });
    return;
  }

  try {
    const result = await performDetokenize(client, token);
    if (!result) {
      throw new Error("No result");
    }
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send({ error: `${e}` });
  }
  endTokenServer(client);
};
