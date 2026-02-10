import "dotenv/config";
import express from "express";

import { appConfig } from "./config/app";
import authController from "./modules/auth/auth.controller";

const app = express();
const { port } = appConfig;

app.use(express.json());

const api = express.Router();

api.use("/auth", authController);

api.get("/", (_req, res) => {
    res.json({ message: "Hello from Express + TypeScript" });
});

app.use("/api/v1", api);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
