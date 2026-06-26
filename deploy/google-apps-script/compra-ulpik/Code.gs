/**
 * ENCUESTA PROCESO DE COMPRA ULPIK
 *
 * Spreadsheet: "Ulpik - ¿Cómo fue tu proceso de compra con Ulpik? (Respuestas)"
 * Pestaña: "Respuestas de formulario 1"
 *
 * Pegar en ese spreadsheet → Extensiones → Apps Script.
 * Desplegar: Implementar → Nueva implementación → Aplicación web
 *   - Ejecutar como: Yo
 *   - Quién tiene acceso: Cualquier persona
 *
 * Probar lectura: ?action=read  o  ?action=debug
 * Escritura: POST { "action": "append-compra", ...campos }
 */

var SHEET_NAME = 'Respuestas de formulario 1';
var SHEET_NAME_ALT = 'Form_Responses';
var WEBHOOK_SECRET = '';

function doGet(e) {
  e = e || {};
  var p = e.parameter || {};

  if (p.action === 'read') {
    try {
      var rows = readSurveyData();
      return jsonpOutput(p.callback, { ok: true, rows: rows });
    } catch (err) {
      return jsonpOutput(p.callback, { ok: false, error: String(err.message || err) });
    }
  }

  if (p.action === 'debug') {
    try {
      return jsonpOutput(p.callback, buildDebugReport());
    } catch (err) {
      return jsonpOutput(p.callback, { ok: false, error: String(err.message || err) });
    }
  }

  if (p.data) {
    try {
      var dataPayload = JSON.parse(p.data);
      if (dataPayload.secret && WEBHOOK_SECRET && dataPayload.secret !== WEBHOOK_SECRET) {
        return jsonOutput({ ok: false, error: 'No autorizado' });
      }
      var dataAction = String(dataPayload.action || 'append-compra');
      if (dataAction === 'append-compra' || dataAction === 'append-survey') {
        var appended = appendCompraRow(dataPayload);
        return jsonOutput({ ok: true, row: appended });
      }
      return jsonOutput({ ok: false, error: 'Acción no reconocida: ' + dataAction });
    } catch (dataErr) {
      return jsonOutput({ ok: false, error: String(dataErr.message || dataErr) });
    }
  }

  if (p.callback) {
    return jsonpOutput(p.callback, { ok: true, message: 'Encuesta proceso de compra ULPIK activa' });
  }
  return jsonOutput({ ok: true, message: 'Encuesta proceso de compra ULPIK activa' });
}

function doPost(e) {
  try {
    var payload = parsePayload(e);
    if (payload.secret && WEBHOOK_SECRET && payload.secret !== WEBHOOK_SECRET) {
      return jsonOutput({ ok: false, error: 'No autorizado' });
    }

    var action = String(payload.action || 'append-compra');
    if (action === 'append-compra' || action === 'append-survey') {
      var row = appendCompraRow(payload);
      return jsonOutput({ ok: true, row: row });
    }

    return jsonOutput({ ok: false, error: 'Acción no reconocida: ' + action });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err.message || err) });
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Cuerpo vacío');
  }
  var raw = e.postData.contents;
  var ct = String((e.postData.type || '')).toLowerCase();
  if (ct.indexOf('application/json') !== -1) {
    return JSON.parse(raw);
  }
  if (ct.indexOf('application/x-www-form-urlencoded') !== -1) {
    var out = {};
    raw.split('&').forEach(function (pair) {
      var bits = pair.split('=');
      if (bits.length >= 2) {
        out[decodeURIComponent(bits[0])] = decodeURIComponent(bits.slice(1).join('='));
      }
    });
    return out;
  }
  try {
    return JSON.parse(raw);
  } catch (parseErr) {
    throw new Error('Formato no soportado');
  }
}

function appendCompraRow(payload) {
  validateCompraPayload(payload);
  var sheet = getSheet();
  var tz = Session.getScriptTimeZone() || 'America/Guayaquil';
  var now = new Date();
  var marca = Utilities.formatDate(now, tz, 'dd/MM/yyyy HH:mm:ss');

  var row = [
    marca,
    String(payload.email || '').trim(),
    String(payload.servicio || '').trim(),
    numCol(payload.facilidad),
    numCol(payload.claridad),
    String(payload.dificultad || '').trim(),
    numCol(payload.atencion),
    String(payload.acomp || '').trim(),
    numCol(payload.nps),
    '',
    '',
    String(payload.asesor || '').trim(),
    String(payload.mejora || '').trim(),
    ''
  ];

  sheet.appendRow(row);
  return { marca: marca, email: row[1] };
}

function validateCompraPayload(p) {
  var email = String(p.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Correo inválido');
  }
  if (!String(p.servicio || '').trim()) throw new Error('Falta servicio');
  if (!numCol(p.facilidad)) throw new Error('Falta facilidad');
  if (!numCol(p.claridad)) throw new Error('Falta claridad');
  if (!String(p.dificultad || '').trim()) throw new Error('Falta dificultad');
  if (!numCol(p.atencion)) throw new Error('Falta atención');
  if (!String(p.acomp || '').trim()) throw new Error('Falta acompañamiento');
  if (!numCol(p.nps)) throw new Error('Falta recomendación');
  if (!String(p.asesor || '').trim()) throw new Error('Falta asesor');
  if (String(p.mejora || '').trim().length < 5) throw new Error('Falta comentario de mejora');
}

function toMarcaDate(raw) {
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  if (typeof raw === 'number' && raw > 0) {
    return new Date(Math.round((raw - 25569) * 86400 * 1000));
  }
  var s = String(raw || '').trim();
  if (!s) return null;
  var datePart = s.split(/\s+/)[0];
  if (datePart.indexOf('/') !== -1) {
    var bits = datePart.split('/');
    if (bits.length >= 3) {
      var d = +bits[0], mo = +bits[1], y = +bits[2];
      if (d && mo && y) return new Date(y, mo - 1, d);
    }
  }
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime()) && /\d{4}/.test(s)) return parsed;
  return null;
}

function parseMarcaTemporal(marca) {
  var d = marca instanceof Date ? marca : toMarcaDate(marca);
  if (d && !isNaN(d.getTime())) {
    var tz = Session.getScriptTimeZone() || 'America/Guayaquil';
    var iso = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    var mesNum = iso.substring(5, 7);
    var anio = iso.substring(0, 4);
    return { iso: iso, mes: anio + '-' + mesNum, anio: anio, mesNum: mesNum };
  }
  return { iso: '', mes: '', anio: '', mesNum: '' };
}

function readSurveyData() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var tz = Session.getScriptTimeZone() || 'America/Guayaquil';
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[1] && !r[2] && (r[3] === '' || r[3] === null || r[3] === undefined)) continue;

    var marcaDate = toMarcaDate(r[0]);
    var marca = marcaDate
      ? Utilities.formatDate(marcaDate, tz, 'dd/MM/yyyy HH:mm:ss')
      : String(r[0] || '');
    var parsed = marcaDate ? parseMarcaTemporal(marcaDate) : parseMarcaTemporal(marca);

    rows.push({
      marca: marca,
      fecha_str: String(parsed.iso || ''),
      mes: String(parsed.mes || ''),
      anio: String(parsed.anio || ''),
      mes_num: String(parsed.mesNum || ''),
      email: String(r[1] || ''),
      servicio: String(r[2] || ''),
      facilidad: numCol(r[3]),
      claridad: numCol(r[4]),
      dificultad: String(r[5] || ''),
      atencion: numCol(r[6]),
      acompanado: String(r[7] || ''),
      recomendacion: numCol(r[8]),
      cliente_recurrente: String(r[9] || ''),
      facturacion: String(r[10] || ''),
      asesor: String(r[11] || ''),
      comentario: String(r[12] || ''),
      nota_interna: String(r[13] || '')
    });
  }
  return rows;
}

function buildDebugReport() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var rawSample = values.length > 1 ? values[values.length - 1][0] : null;
  var rows = readSurveyData();
  var byMonth = {};
  var sinFecha = 0;
  rows.forEach(function (r) {
    if (r.mes) byMonth[r.mes] = (byMonth[r.mes] || 0) + 1;
    else sinFecha++;
  });
  return {
    ok: true,
    sheet: sheet.getName(),
    total: rows.length,
    sin_fecha: sinFecha,
    por_mes: byMonth,
    raw_tipo: rawSample === null ? 'vacío' : Object.prototype.toString.call(rawSample),
    raw_muestra: rawSample === null ? null : String(rawSample).substring(0, 80),
    ultimas_3: rows.slice(-3).map(function (r) {
      return {
        marca: r.marca,
        anio: r.anio,
        mes_num: r.mes_num,
        asesor: r.asesor,
        recomendacion: r.recomendacion
      };
    })
  };
}

function numCol(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheetByName(SHEET_NAME_ALT);
  if (!sheet) {
    throw new Error('No existe la pestaña: ' + SHEET_NAME + ' ni ' + SHEET_NAME_ALT);
  }
  return sheet;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpOutput(callback, obj) {
  var cb = callback || 'callback';
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function testReadData() {
  var report = buildDebugReport();
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function testAppendCompra() {
  return appendCompraRow({
    email: 'test@ulpik.com',
    servicio: 'Registro de marca',
    facilidad: 10,
    claridad: 9,
    dificultad: 'Ninguna, todo fue claro',
    atencion: 10,
    acomp: 'Sí, totalmente',
    nps: 10,
    asesor: 'Martín Coello (Martín)',
    mejora: 'Prueba automática desde Apps Script'
  });
}
