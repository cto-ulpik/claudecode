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

## Google Sheet sigue en 405

El POST al Apps Script requiere **Implementar → Nueva implementación** en el Sheet NPS ULPIK con `Code.gs` (función `doPost`) y acceso **Cualquier persona**. Ejecuta `testAppendRow` en el editor antes de probar.
