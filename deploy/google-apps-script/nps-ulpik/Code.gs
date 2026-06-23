/**
 * NPS ULPIK — Webhook para encuesta de satisfacción (ia.ulpik.com/satisfaccion)
 *
 * Instalar: Extensiones → Apps Script → pegar este código en el spreadsheet "NPS ULPIK".
 * Desplegar: Implementar → Nueva implementación → Aplicación web
 *   - Ejecutar como: Yo
 *   - Quién tiene acceso: Cualquier persona
 *
 * Opcional (Script properties → WEBHOOK_SECRET): token compartido con el servidor.
 */

var SHEET_NAME = 'Respuestas de formulario 1';

function doGet() {
  return jsonOutput({ ok: true, message: 'Webhook NPS ULPIK activo' });
}

function doPost(e) {
  try {
    var payload = parsePayload(e);
    validatePayload(payload);
    appendSurveyRow(payload);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err.message || err) });
  }
}

function parsePayload(e) {
  var data = null;
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      throw new Error('JSON inválido en POST');
    }
  } else if (e && e.parameter && e.parameter.payload) {
    data = JSON.parse(e.parameter.payload);
  }
  if (!data) {
    throw new Error('Cuerpo POST vacío');
  }
  var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (secret && data.token !== secret) {
    throw new Error('Token inválido');
  }
  return data;
}

function validatePayload(data) {
  if (!data.email || typeof data.email !== 'string') {
    throw new Error('Falta email');
  }
  if (!data.asesor || typeof data.asesor !== 'string') {
    throw new Error('Falta asesor');
  }
  ['nps', 'claridad', 'velocidad', 'calidad', 'satisfaccion'].forEach(function (key) {
    if (typeof data[key] !== 'number') {
      throw new Error('Falta calificación: ' + key);
    }
  });
}

function appendSurveyRow(data) {
  var sheet = getSheet();
  var tz = Session.getScriptTimeZone() || 'America/Guayaquil';
  var marca = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss');

  var servicio = data.servicio;
  if (!servicio || servicio === 'No especificado') servicio = 'N/A';

  var instagram = data.instagram || '';

  // Columnas A–K alineadas con "Respuestas de formulario 1"
  sheet.appendRow([
    marca,                    // A Marca temporal
    data.email,               // B Correo
    data.asesor,              // C Asesor
    data.nps,                 // D Recomendación
    data.claridad,            // E Claridad
    data.velocidad,           // F Velocidad
    data.calidad,             // G Calidad
    data.satisfaccion,        // H Satisfacción final
    data.comentario || '',    // I Comentario / mejoras
    servicio,                 // J Servicio contratado
    instagram                 // K Instagram (opcional)
  ]);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('No existe la pestaña: ' + SHEET_NAME);
  }
  return sheet;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar manualmente en el editor para probar una fila de prueba. */
function testAppendRow() {
  appendSurveyRow({
    email: 'prueba@ulpik.com',
    asesor: 'Esteban Maldonado',
    nps: 10,
    claridad: 9,
    velocidad: 8,
    calidad: 9,
    satisfaccion: 10,
    comentario: 'Prueba desde Apps Script',
    servicio: 'Registro de marca',
    instagram: '@ulpik_test'
  });
  Logger.log('Fila de prueba agregada.');
}
