import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./db.js";
import { dashboardRouter } from "./routes/dashboards.js";
import { sheetsRouter } from "./routes/sheets.js";
import { surveysRouter } from "./routes/surveys.js";
import { tituloRouter } from "./routes/titulo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const distDir = path.join(__dirname, "..", "dist");
const serveStatic =
  process.env.SERVE_STATIC === "1" ||
  (process.env.NODE_ENV === "production" && process.env.SERVE_STATIC !== "0");

getDb();

const app = express();
app.use(express.json({ limit: "32mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/dashboards", dashboardRouter);
app.use("/api/sheets", sheetsRouter);
app.use("/api/surveys", surveysRouter);
app.use("/api/titulo", tituloRouter);

if (serveStatic) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.listen(PORT, () => {
  console.log(`[server] http://127.0.0.1:${PORT} (SQLite, static=${serveStatic})`);
});
