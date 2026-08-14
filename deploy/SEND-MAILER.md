# Send Mailer — avances de registro

Herramienta interna: `https://ia.ulpik.com/send-mailer` (requiere sesión).

## Flujo

1. Seleccionar una de las 6 etapas.
2. Adjuntar el PDF de respaldo.
3. El navegador extrae el texto con PDF.js e intenta completar los campos.
4. Revisar campos, destinatario, asunto y mensaje.
5. Enviar mediante `POST /api/send-mailer/send-email`.
6. La API reenvía al Apps Script NPS con la acción `send-stage-email`.

## Etapas

- Búsqueda fonética
- Inicio de trámite
- Publicación en Gaceta
- Fin de Gaceta (con o sin oposición)
- Resolución favorable
- Título de registro

## Despliegue

El Apps Script usado por `GOOGLE_SHEETS_NPS_WEBAPP_URL` debe incluir la función
`sendStageEmail` de `deploy/google-apps-script/nps-ulpik/Code.gs`.

Después de pegar el código:

1. Apps Script → **Implementar** → **Administrar implementaciones**.
2. Editar la implementación activa.
3. Seleccionar **Nueva versión**.
4. Implementar.
5. Ejecutar `authorizeMail()` si Google solicita permisos de correo.

En el servidor:

```bash
git pull origin main
npm run build
pm2 restart claudecode-api --update-env
```

## Extracción del PDF

La extracción funciona en PDFs con texto seleccionable. Un PDF escaneado como
imagen requiere OCR y no será leído por PDF.js. Todos los datos extraídos se
muestran para revisión antes de enviar.

El asesor se intenta obtener únicamente del PDF, buscando la etiqueta `ASESOR`
o uno de los nombres conocidos. Si el documento no contiene ese dato, el envío
se bloquea para evitar firmar con un asesor incorrecto.
