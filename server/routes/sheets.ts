import { Router } from "express";
import { fetchGoogleSheetRows, rowsToCsv } from "../lib/googleSheets.js";

export const sheetsRouter = Router();

/** Permite fetch desde iframes srcDoc (origen opaco) hacia /api/sheets. */
sheetsRouter.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

sheetsRouter.options("/:spreadsheetId", (_req, res) => {
  res.status(204).send();
});

/**
 * GET /api/sheets/:spreadsheetId?sheet=ulpik.com&format=csv|json
 * Proxy servidor → Google gviz (evita CORS en dashboards embebidos).
 */
sheetsRouter.get("/:spreadsheetId", async (req, res) => {
  const sheet = typeof req.query.sheet === "string" ? req.query.sheet : "";
  const format = typeof req.query.format === "string" ? req.query.format : "json";

  try {
    const rows = await fetchGoogleSheetRows(req.params.spreadsheetId, sheet);
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.send(rowsToCsv(rows));
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({
      spreadsheetId: req.params.spreadsheetId,
      sheet,
      rows,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer Google Sheets";
    res.status(502).json({ error: message });
  }
});
