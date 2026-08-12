# Google Apps Script — NPS ULPIK

Guarda las respuestas de [ia.ulpik.com/satisfaccion](https://ia.ulpik.com/satisfaccion) en el spreadsheet **NPS ULPIK**, pestaña **Respuestas de formulario 1**.

## Columnas que escribe el script

| Col | Campo del Sheet | Origen |
|-----|-----------------|--------|
| A | Marca temporal | Fecha/hora automática |
| B | Dirección de correo electrónico | Email del cliente |
| C | Asesor | Selector de asesor |
| D | Recomendación (NPS 1–10) | Pregunta recomendación |
| E | Claridad | Pregunta claridad |
| F | Velocidad | Pregunta velocidad |
| G | Calidad | Pregunta calidad atención |
| H | Satisfacción final | Pregunta resultado final |
| I | Comentario / mejoras | “Si pudieras cambiar algo…” |
| J | Servicio contratado | Selector de servicio |
| K | Instagram | Campo opcional @usuario |
| L | *(sin uso)* | El webhook la deja vacía |
| M | Qué faltó para el 10 (Satisfacción) | Solo si satisfacción &lt; 10 |

## Instalación

1. Abre el Google Sheet **NPS ULPIK**.
2. **Extensiones → Apps Script**.
3. Borra el contenido por defecto y pega `Code.gs`.
4. Guarda el proyecto (nombre sugerido: `NPS ULPIK Webhook`).
5. (Opcional) En **Configuración del proyecto → Propiedades del script**, añade:
   - `WEBHOOK_SECRET` = una clave larga aleatoria (misma que en el servidor).
6. Ejecuta **`authorizeMail`** (no `testAppendRow` primero):
   - Menú desplegable de funciones → elige **`authorizeMail`**
   - Pulsa **Ejecutar** ▶
   - Debe aparecer **Revisar permisos** → elige tu cuenta → **Permitir**
   - Si no aparece: **Ejecutar → Revisar permisos** o borra autorizaciones en [myaccount.google.com/permissions](https://myaccount.google.com/permissions) y vuelve a ejecutar
7. Ejecuta **`testAppendRow`** para probar fila + correo.
8. **Implementar → Nueva implementación** (obligatorio tras nuevos permisos):
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
9. Copia la URL que termina en `/exec`.

## Conectar con ia.ulpik.com

En el servidor (`/var/www/html/claudecode`), configura la variable de entorno (o usa `deploy/ecosystem.config.cjs.example`):

```bash
GOOGLE_SHEETS_NPS_WEBAPP_URL=https://script.google.com/macros/s/AKfycbzTU-aXouMJcdhu10goVd3RWpNwRDQkgq8jiJC6RNAFJRVGP4pQh6078zMTI925HsCr/exec
GOOGLE_SHEETS_NPS_WEBHOOK_SECRET=
```

Reinicia la API:

```bash
pm2 restart claudecode-api
```

La encuesta envía a `POST /api/surveys`; el backend guarda en SQLite **y** reenvía al Apps Script.

Al guardar cada respuesta, el script envía un correo a **churchill@ulpik.com** con el email del respondiente y un resumen de la encuesta (vía `MailApp.sendEmail`, cuenta que ejecuta el script: cto@ulpik.com).

Webhook activo: [verificar GET](https://script.google.com/macros/s/AKfycbzTU-aXouMJcdhu10goVd3RWpNwRDQkgq8jiJC6RNAFJRVGP4pQh6078zMTI925HsCr/exec) → `{"ok":true,"message":"Webhook NPS ULPIK activo"}`.

Últimos correos para `/titulo` (vía API): `GET ?action=recent-emails&limit=5` → `{"ok":true,"emails":["..."]}`.

## Probar el webhook

```bash
curl -X POST "$GOOGLE_SHEETS_NPS_WEBAPP_URL" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@ulpik.com","asesor":"Esteban Maldonado","nps":10,"claridad":9,"velocidad":8,"calidad":9,"satisfaccion":9,"satisfaccionMejora":"Más seguimiento post-entrega","comentario":"Prueba curl","servicio":"SAS","instagram":""}'
```

Debe aparecer una fila nueva en el Sheet (columna M con el texto de satisfacción) y la respuesta `{"ok":true}`.

Si satisfacción es 10, `satisfaccionMejora` puede ir vacío y M queda en blanco.
