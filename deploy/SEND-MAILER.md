# Send Mailer — avances de registro

Herramienta: `https://ia.ulpik.com/send-mailer` (mismo patrón público que `/titulo`).

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

### Búsqueda fonética (informe Ulpik BF)

Mapeo del PDF tipo `Ulpik - BF - …`:

| Campo UI | Origen en el PDF |
|----------|------------------|
| Nombre del cliente | `CLIENTE` / `Nombre del cliente` |
| Marca | `DENOMINACIÓN DEL SIGNO` |
| Fecha del informe | 3.ª línea del encabezado (p. ej. `… • 27 de mayo de 2025`) |
| Nombre del asesor | `ABOGADO A CARGO` |

### Inicio de trámite (Formato Único SENADI)

Mapeo del PDF tipo `… - INICIO DE TRAMITE`:

| Campo UI | Origen en el PDF |
|----------|------------------|
| Nombre del cliente | Primer `Nombre:` en *Identificación de los solicitantes* |
| Marca | `Denominación del Signo` (sin el sufijo `MAS LOGOTIPO`) |
| N.º de trámite | `SENADI-AAAA-#####` |
| Fecha | `Fecha de Presentación` (solo fecha, sin hora) |
| Clase(s) Niza | `Clasificación Internacional No.` |
| Nombre del asesor | `Nombre:` bajo *Abogado patrocinador* |

### Resolución favorable (SENADI)

Mapeo del PDF tipo `… - Resolucion`:

| Campo UI | Origen en el PDF |
|----------|------------------|
| Nombre del cliente | `presentada por …` (o `a favor de …`) |
| Marca | `registro del signo:` (sin `MAS LOGOTIPO`) |
| N.º de trámite | `Trámite No. SENADI-…` |
| N.º de resolución | `Número de resolución: SENADI_AAAA_RS_#####` |
| Fecha | `Quito, a … de … de …` |
| Nombre del asesor | No viene en el PDF; hay que completarlo a mano |

### Título de registro (SENADI)

Mapeo del PDF tipo `… - Titulo`:

| Campo UI | Origen en el PDF |
|----------|------------------|
| Nombre del cliente / Titular | `TITULAR:` |
| Marca | `DENOMINACIÓN:` (sin `más logotipo`) |
| N.º de registro | `SENADI_AAAA_TI_#####` (encabezado del título) |
| Clase(s) Niza | `Clase Internacional …` |
| Vigencia | fecha de la resolución de origen – `VENCIMIENTO:` |
| Nombre del asesor | No viene en el PDF; hay que completarlo a mano |

El título cita su resolución de origen, por eso se detecta antes que el PDF de
resolución favorable.

El asesor se intenta obtener del PDF (`ABOGADO A CARGO` /
`Abogado patrocinador` o nombres conocidos). Si falta, el envío se bloquea hasta
completarlo manualmente.
