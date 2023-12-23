import express, { Request, Response } from "express";
import { tokenize } from "./../components/tokenise";

export const tokeniseApi = express.Router();

tokeniseApi.post("/", (req: Request, res: Response) => {
  tokenize(req, res);
});
