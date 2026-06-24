#!/usr/bin/env bash
# Prueba la encuesta NPS: API + Apps Script
# Uso: ./deploy/test-satisfaccion.sh [base_url]
# Ejemplo: ./deploy/test-satisfaccion.sh https://ia.ulpik.com

set -euo pipefail

BASE="${1:-https://ia.ulpik.com}"
APPS_SCRIPT_URL="${GOOGLE_SHEETS_NPS_WEBAPP_URL:-https://script.google.com/macros/s/AKfycbzMWWAF5hxkS3MgTCaX51EoCWIpfVFMI4uBekLnwIJGXn2NL54wAi6UgvwI7QF_CFGr/exec}"

PAYLOAD='{"email":"test-satisfaccion@ulpik.com","asesor":"Esteban Maldonado","servicio":"SAS","nps":10,"claridad":9,"velocidad":8,"calidad":9,"satisfaccion":10,"comentario":"Prueba automatizada deploy/test-satisfaccion.sh","instagram":"","fecha_str":"2026-06-24","hora":"12:00","mes":"2026-06","ts":1719230000000}'

echo "=== 1. Health API ==="
curl -s "$BASE/api/health" | head -c 200
echo -e "\n"

echo "=== 2. POST /api/surveys (SQLite + Google Sheets vía servidor) ==="
RESP=$(curl -s -w "\nHTTP:%{http_code}" -X POST "$BASE/api/surveys" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")
echo "$RESP"
echo ""

echo "=== 3. GET /api/surveys (últimas respuestas en SQLite) ==="
curl -s "$BASE/api/surveys" | tail -c 400
echo -e "\n"

echo "=== 4. GET Apps Script (webhook activo?) ==="
curl -sL "$APPS_SCRIPT_URL" | head -c 200
echo -e "\n"

echo "=== 5. GET Apps Script con data= (fallback, debe devolver {\"ok\":true}) ==="
ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$PAYLOAD")
curl -sL -w "\nHTTP:%{http_code}\n" "${APPS_SCRIPT_URL}?data=${ENC}" | tail -3

echo ""
echo "=== 6. POST Apps Script directo (puede fallar 405; el servidor usa GET fallback) ==="
curl -sL -w "\nHTTP:%{http_code}\n" -X POST "$APPS_SCRIPT_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" | tail -3

echo ""
echo "Interpretación:"
echo "  - POST /api/surveys → sheets:\"ok\"     = guardado en Google Sheet"
echo "  - POST /api/surveys → sheets:\"skipped\" = falta GOOGLE_SHEETS_NPS_WEBAPP_URL en PM2"
echo "  - POST /api/surveys → sheets:\"error\"  = webhook falló (revisa pm2 logs)"
echo "  - Paso 5 GET ?data= → {\"ok\":true}     = Apps Script listo (actualiza Code.gs y reimplementa)"
echo "  - Paso 6 POST 405                     = normal; el servidor usa GET fallback"
