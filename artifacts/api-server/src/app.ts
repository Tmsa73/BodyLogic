import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built frontend SPA from the api-server.
// Build copies the frontend into ./public next to the bundled server.
const frontendCandidates = [
  path.resolve(process.cwd(), "artifacts/health-app/dist/public"),
  path.resolve(__dirname, "public"),
  path.resolve(__dirname, "../public"),
];
const frontendDir = frontendCandidates.find((p) => existsSync(p));
if (frontendDir) {
  logger.info({ frontendDir }, "Serving static frontend");
  app.use(express.static(frontendDir, { maxAge: "1h", index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

export default app;
