import {
  performTokenize,
  validateTokenizeInput,
  validateTokenizePanInput,
} from "../util/tokeniseUtil";
import { endTokenServer, startTokenServer } from "../util/dbUtil";
import { Logger } from "./../util/logger";

const logger = Logger;

export const tokenize = async (req, res) => {
  logger.info("~~tokenize~~");
  if (!req || !req.body) {
    res.status(400).send({ error: `no request is given` });
    return;
  }
  const { pan, mm, yyyy, name } = req.body;
  try {
    validateTokenizePanInput(pan);
    if (mm && yyyy) {
      validateTokenizeInput(mm, yyyy);
    }
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
    const token = await performTokenize(client, pan, mm, yyyy, name);
    res.status(200).send({ token: token });
    return;
  } catch (e) {
    res.status(500).send({ error: `${e}` });
  }
  endTokenServer(client);
};
