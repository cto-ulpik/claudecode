# Recuperar API caída (502 en ia.ulpik.com)

Si tras `pm2 reload ecosystem.config.cjs` la API responde **502**, suele ser que PM2 no arrancó `tsx` (evitar `script: "npx"`).

## En el servidor

```bash
cd /var/www/html/claudecode
git pull
npm install   # tsx está en devDependencies; hace falta en el servidor
cp deploy/ecosystem.config.cjs.example ecosystem.config.cjs

pm2 delete claudecode-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Comprobar
pm2 logs claudecode-api --lines 30
curl -s http://127.0.0.1:3004/api/health
./deploy/test-satisfaccion.sh https://ia.ulpik.com
```

`curl` local debe devolver `{"ok":true}`. Si falla, revisa el log de PM2.

## Google Sheet: `sheets:"error"` o POST HTTP 405

El GET del webhook puede responder OK, pero el **POST falla** si no hay un despliegue web con `doPost`.

1. Abre el Sheet **NPS ULPIK** → **Extensiones → Apps Script**.
2. Pega todo `deploy/google-apps-script/nps-ulpik/Code.gs`.
3. Menú **Ejecutar → testAppendRow** (autoriza permisos). Debe aparecer una fila en el Sheet.
4. **Implementar → Nueva implementación** (no “Administrar”):
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
5. Copia la URL `/exec`. Si cambió, edítala en `ecosystem.config.cjs`:
   ```bash
   nano ecosystem.config.cjs   # GOOGLE_SHEETS_NPS_WEBAPP_URL=...
   pm2 reload ecosystem.config.cjs
   ```
6. Prueba POST directo (debe devolver `{"ok":true}`):
   ```bash
   curl -sL -X POST "$GOOGLE_SHEETS_NPS_WEBAPP_URL" \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@ulpik.com","asesor":"Esteban Maldonado","nps":10,"claridad":9,"velocidad":8,"calidad":9,"satisfaccion":10,"comentario":"Prueba","servicio":"SAS","instagram":""}'
   ```
7. `./deploy/test-satisfaccion.sh` → paso 2 debe mostrar `"sheets":"ok"`.
