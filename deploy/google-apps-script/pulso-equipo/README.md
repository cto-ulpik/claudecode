# Pulso del Equipo

Check-in semanal interno Ulpik.

## URLs

- **Equipo (público):** `https://ia.ulpik.com/pulso-equipo/`
- **Diagnóstico general:** mismo enlace → pestaña «Diagnóstico General» (PIN interno)

## Apps Script

Fuente: [`Code.gs`](./Code.gs)

Web App URL en `GOOGLE_SHEETS_PULSO_WEBAPP_URL` (`.env` / PM2) y hardcodeada en `public/pulso-equipo/app.js`.

Desplegar como aplicación web: Ejecutar como **Yo**, acceso **Cualquier persona** (JSONP desde el navegador).

### Columnas nuevas (K–N)

El formulario envía 4 campos de seguimiento. Hay que actualizar el Apps Script desplegado:

1. Abrir el proyecto Apps Script del Sheet Pulso.
2. Reemplazar el contenido por `Code.gs` de este folder.
3. **Implementar → Nueva versión** (misma URL si editas la implementación existente).
4. Ejecutar `testGuardar()` desde el editor: debe crear headers K–N y una fila de prueba.
5. Ejecutar `testOpenAIAuth()` si pediste permisos de nuevo.

| Col | Header | Campo JSON |
|-----|--------|------------|
| K | Motivo Score Bajo | `motivoScore` |
| L | Carga Comentario | `cargaComentario` |
| M | Departamento | `departamento` |
| N | Motivación Comentario | `motivacionComentario` |

Las filas antiguas quedan con K–N vacías; no se reordenan A–J.

## Archivos

- `public/pulso-equipo/` — formulario y dashboard
- `deploy/google-apps-script/pulso-equipo/Code.gs` — Web App Sheets + OpenAI
- `src/pages/UlpikPulsoEquipoPage.tsx` — ruta React `/pulso-equipo`
