# Google Apps Script — NPS ULPIK

Guarda las respuestas de [ia.ulpik.com/satisfaccion](https://ia.ulpik.com/satisfaccion) en el spreadsheet **NPS ULPIK**, pestaña **Respuestas de formulario 1**.

## Columnas que escribe el script

| Col | Campo del Sheet |
|-----|-----------------|
| A | Marca temporal |
| B | Dirección de correo electrónico |
| C | Asesor |
| D | Recomendación (NPS 1–10) |
| E | Claridad |
| F | Velocidad |
| G | Calidad |
| H | Satisfacción final |
| I | Comentario / mejoras |
| J | Servicio contratado |
| K | Instagram |

## Instalación

1. Abre el Google Sheet **NPS ULPIK**.
2. **Extensiones → Apps Script**.
3. Borra el contenido por defecto y pega `Code.gs`.
4. Guarda el proyecto (nombre sugerido: `NPS ULPIK Webhook`).
5. (Opcional) En **Configuración del proyecto → Propiedades del script**, añade:
   - `WEBHOOK_SECRET` = una clave larga aleatoria (misma que en el servidor).
6. Ejecuta `testAppendRow` una vez y autoriza permisos.
7. **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
8. Copia la URL que termina en `/exec`.

## Conectar con ia.ulpik.com

En el servidor (`/var/www/html/claudecode`), configura la variable de entorno (o usa `deploy/ecosystem.config.cjs.example`):

```bash
GOOGLE_SHEETS_NPS_WEBAPP_URL=https://script.google.com/macros/s/AKfycbx5kXSF9lLxcV2ucFGZMejRjVZj_BK0j_ELO-ey1bQlBxAKOONe6ZwHMm2fBxU2QKV7/exec
GOOGLE_SHEETS_NPS_WEBHOOK_SECRET=
```

Reinicia la API:

```bash
pm2 restart claudecode-api
```

La encuesta envía a `POST /api/surveys`; el backend guarda en SQLite **y** reenvía al Apps Script.

Webhook activo: [verificar GET](https://script.google.com/macros/s/AKfycbx5kXSF9lLxcV2ucFGZMejRjVZj_BK0j_ELO-ey1bQlBxAKOONe6ZwHMm2fBxU2QKV7/exec) → `{"ok":true,"message":"Webhook NPS ULPIK activo"}`.

## Probar el webhook

```bash
curl -X POST "$GOOGLE_SHEETS_NPS_WEBAPP_URL" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@ulpik.com","asesor":"Esteban Maldonado","nps":10,"claridad":9,"velocidad":8,"calidad":9,"satisfaccion":10,"comentario":"Prueba curl","servicio":"SAS","instagram":""}'
```

Debe aparecer una fila nueva en el Sheet y la respuesta `{"ok":true}`.
