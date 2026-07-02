import express from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

const ready = registerRoutes(app).then(() => undefined);

export default async function handler(req: any, res: any) {
  await ready;
  return app(req, res);
}
