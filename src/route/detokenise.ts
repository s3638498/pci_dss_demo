import express, { Request, Response } from "express";
import { detokenise } from "./../components/detokenise";
export const detokeniseApi = express.Router();

detokeniseApi.post("/", (req: Request, res: Response) => {
  detokenise(req, res);
});
