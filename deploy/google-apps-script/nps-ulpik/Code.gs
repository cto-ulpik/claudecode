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
var NOTIFY_EMAIL = 'churchill@ulpik.com,legal5@ulpik.com';

function doGet(e) {
  e = e || {};
  if (e.parameter && e.parameter.action === 'recent-emails') {
    try {
      var limit = parseInt(e.parameter.limit, 10) || 5;
      return jsonOutput({ ok: true, emails: getRecentSurveyEmails(limit) });
    } catch (err) {
      return jsonOutput({ ok: false, error: String(err.message || err) });
    }
  }
  if (e.parameter && e.parameter.data) {
    try {
      var payload = JSON.parse(e.parameter.data);
      var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
      if (secret && payload.token !== secret) {
        throw new Error('Token inválido');
      }
      if (payload.action === 'send-titulo') {
        sendTituloEmail(payload);
        return jsonOutput({ ok: true });
      }
      validatePayload(payload);
      appendSurveyRow(payload);
      return jsonOutput({ ok: true });
    } catch (err) {
      return jsonOutput({ ok: false, error: String(err.message || err) });
    }
  }
  return jsonOutput({ ok: true, message: 'Webhook NPS ULPIK activo' });
}

function doPost(e) {
  try {
    var payload = parsePayload(e);
    if (payload.action === 'send-titulo') {
      sendTituloEmail(payload);
      return jsonOutput({ ok: true });
    }
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

  sendSurveyNotification(data, marca);
}

function validateTituloPayload(data) {
  if (!data.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
    throw new Error('Correo destinatario inválido');
  }
  if (!data.titular || typeof data.titular !== 'string') {
    throw new Error('Falta titular');
  }
  if (!data.denominacion || typeof data.denominacion !== 'string') {
    throw new Error('Falta denominación');
  }
  if (!data.body || typeof data.body !== 'string') {
    throw new Error('Falta mensaje');
  }
  if (!data.pdfBase64 || typeof data.pdfBase64 !== 'string') {
    throw new Error('Falta PDF del título');
  }
}

function sendTituloEmail(data) {
  validateTituloPayload(data);
  var bytes = Utilities.base64Decode(data.pdfBase64);
  var filename = data.pdfFilename || 'titulo-concesion.pdf';
  var blob = Utilities.newBlob(bytes, 'application/pdf', filename);
  var subject = data.subject || 'Está listo tu título 🎉';

  MailApp.sendEmail({
    to: data.to,
    subject: subject,
    body: data.body,
    htmlBody: data.htmlBody || '',
    name: 'Ulpik',
    attachments: [blob]
  });
}

function sendSurveyNotification(data, marca) {
  try {
    var avg = ((data.nps + data.claridad + data.velocidad + data.calidad + data.satisfaccion) / 5).toFixed(1);
    var tituloUrl = 'https://ia.ulpik.com/titulo/?email=' + encodeURIComponent(data.email || '');
    var subject = 'Nueva encuesta de satisfacción — ' + data.email;
    var body =
      'Alguien acaba de completar la encuesta de satisfacción en ia.ulpik.com/satisfaccion.\n\n' +
      'Correo del respondiente: ' + data.email + '\n' +
      'Fecha: ' + marca + '\n' +
      'Asesor: ' + data.asesor + '\n' +
      'Servicio: ' + (data.servicio || 'N/A') + '\n' +
      'Promedio: ' + avg + '/10\n' +
      'NPS: ' + data.nps + ' | Claridad: ' + data.claridad + ' | Velocidad: ' + data.velocidad +
      ' | Calidad: ' + data.calidad + ' | Satisfacción: ' + data.satisfaccion + '\n\n' +
      'Comentario:\n' + (data.comentario || '(sin comentario)') + '\n\n' +
      'Enviar título de concesión (correo precargado):\n' + tituloUrl + '\n\n' +
      '— Encuesta NPS Ulpik (automático)';

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body,
      name: 'Encuesta Ulpik'
    });
  } catch (err) {
    Logger.log('No se pudo enviar correo a ' + NOTIFY_EMAIL + ': ' + err);
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('No existe la pestaña: ' + SHEET_NAME);
  }
  return sheet;
}

/** Últimos correos únicos de la encuesta (columna B), más recientes primero. */
function getRecentSurveyEmails(limit) {
  limit = Math.max(1, Math.min(20, limit || 5));
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var scan = Math.min(lastRow - 1, 500);
  var startRow = Math.max(2, lastRow - scan + 1);
  var values = sheet.getRange(startRow, 2, lastRow, 2).getValues();
  var seen = {};
  var out = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var raw = String(values[i][0] || '').trim();
    if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) continue;
    var key = raw.toLowerCase();
    if (seen[key]) continue;
    seen[key] = true;
    out.push(raw);
    if (out.length >= limit) break;
  }
  return out;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar PRIMERO: fuerza el diálogo de permisos para enviar correo. */
function authorizeMail() {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Autorización — Encuesta Ulpik',
    body: 'Si recibes este correo, el script ya puede notificar nuevas encuestas.',
    name: 'Encuesta Ulpik'
  });
  Logger.log('Correo de autorización enviado a ' + NOTIFY_EMAIL);
}

/** Probar lectura de últimos correos (editor Apps Script). */
function testRecentEmails() {
  Logger.log(JSON.stringify(getRecentSurveyEmails(5)));
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
