#!/usr/bin/env bash
# Prueba encuesta compra → Google Sheet
# Uso: ./deploy/test-compra.sh [base_url]
# Ejemplo: ./deploy/test-compra.sh https://ia.ulpik.com

set -euo pipefail
BASE="${1:-http://127.0.0.1:3001}"
APPS_SCRIPT_URL="${GOOGLE_SHEETS_COMPRA_WEBAPP_URL:-https://script.google.com/macros/s/AKfycbwAnTCKxLUYJwb4tMNAAGxPsUIYO_FofertmW-FhXlCPGj5FoNw7pmUMmarK5RUJIQA/exec}"

PAYLOAD='{"action":"append-compra","email":"test-compra@ulpik.com","servicio":"Registro de marca","facilidad":10,"claridad":9,"dificultad":"Ninguna, todo fue claro","atencion":10,"acomp":"Sí, totalmente","nps":10,"asesor":"Martín Coello (Martín)","mejora":"Prueba deploy/test-compra.sh","ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}'

echo "== Apps Script GET (health) =="
curl -sS "$APPS_SCRIPT_URL"
echo ""

echo "== Apps Script GET ?data= (debe devolver row) =="
DATA_URL="${APPS_SCRIPT_URL}?data=$(python3 -c 'import json,sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$PAYLOAD")"
RESP=$(curl -sS "$DATA_URL")
echo "$RESP"
if echo "$RESP" | grep -q '"row"'; then
  echo "OK: Apps Script escribió fila"
else
  echo "ERROR: Apps Script no escribió (redespliega Code.gs con doPost y GET ?data=)"
  exit 1
fi

echo ""
echo "== API $BASE/api/compra =="
HTTP=$(curl -sS -o /tmp/compra-test.json -w "%{http_code}" -X POST "$BASE/api/compra" \
  -H 'Content-Type: application/json' -d "$PAYLOAD")
cat /tmp/compra-test.json
echo ""
echo "HTTP:$HTTP"
[[ "$HTTP" == "200" ]] || exit 1
