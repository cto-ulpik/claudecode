import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./db.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboards.js";
import { sheetsRouter } from "./routes/sheets.js";
import { surveysRouter } from "./routes/surveys.js";
import { tituloRouter } from "./routes/titulo.js";
import { compraRouter } from "./routes/compra.js";
import { sendMailerRouter } from "./routes/sendMailer.js";
import { tripleImpactRouter } from "./routes/tripleImpact.js";
import { auditorRouter } from "./routes/auditor.js";
import { estadoMarcaRouter, proxyBrandByUpk, proxyBrandsByDni } from "./routes/estadoMarca.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const distDir = path.join(__dirname, "..", "dist");
const serveStatic =
  process.env.SERVE_STATIC === "1" ||
  (process.env.NODE_ENV === "production" && process.env.SERVE_STATIC !== "0");

getDb();

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "32mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

/** Herramientas internas: requieren sesión. */
app.use("/api/dashboards", requireAuth, dashboardRouter);
app.use("/api/sheets", requireAuth, sheetsRouter);
app.use("/api/auditor", requireAuth, auditorRouter);

/** Formularios públicos Ulpik (sin login). */
app.use("/api/surveys", surveysRouter);
app.use("/api/titulo", tituloRouter);
app.use("/api/compra", compraRouter);
app.use("/api/send-mailer", sendMailerRouter);
app.use("/api/triple-impact", tripleImpactRouter);
/** Proxy al brands-manager para /estado-marca */
app.use("/api/estado-marca", estadoMarcaRouter);
app.get("/api/brand/upk/:code", proxyBrandByUpk);
app.get("/api/brands/dni/:dni", proxyBrandsByDni);

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
