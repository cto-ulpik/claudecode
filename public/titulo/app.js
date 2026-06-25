let horaChip = 'am';
let pdfDataUrl = '';
let pdfFileName = '';
let msgVisible = false;

function getFormData() {
  return {
    titular: (document.getElementById('t-nombre')?.value || '').trim(),
    denominacion: (document.getElementById('t-marca')?.value || '').trim(),
    email: (document.getElementById('t-email')?.value || '').trim(),
  };
}

function showToast(msg, t = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = (t === 'ok' ? '✓  ' : t === 'er' ? '✗  ' : 'ℹ  ') + msg;
  el.className = 'toast show ' + t;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 5000);
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const email = (params.get('email') || params.get('correo') || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  const select = document.getElementById('t-email');
  let found = false;
  for (const opt of select.options) {
    if (opt.value.toLowerCase() === email.toLowerCase()) {
      select.value = opt.value;
      found = true;
      break;
    }
  }
  if (!found) {
    const opt = document.createElement('option');
    opt.value = email;
    opt.textContent = email + ' (del enlace)';
    select.appendChild(opt);
    select.value = email;
  }
}

function populateEmailSelect(emails) {
  const select = document.getElementById('t-email');
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = emails.length ? 'Selecciona un correo…' : 'Sin correos recientes en la encuesta';
  select.appendChild(placeholder);
  emails.forEach((email) => {
    const opt = document.createElement('option');
    opt.value = email;
    opt.textContent = email;
    select.appendChild(opt);
  });
  applyQueryParams();
}

async function loadRecentEmails() {
  try {
    const res = await fetch('/api/surveys/recent-emails?limit=5');
    if (!res.ok) throw new Error('api');
    const data = await res.json();
    populateEmailSelect(Array.isArray(data.emails) ? data.emails : []);
  } catch {
    populateEmailSelect([]);
  }
}

function setChip(tipo) {
  horaChip = tipo;
  ['am', 'pm', 'night'].forEach((c) => {
    document.getElementById('chip-' + c).classList.toggle('on', c === tipo);
  });
  buildMsg();
}

/** Extrae denominación y titular del texto del título SENADI. */
function parseTituloText(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const denominacion =
    flat.match(/DENOMINACI[ÓO]N\s*:\s*(.+?)\s+PRODUCTOS(?:\s+O\s+SERVICIOS)?/i)?.[1]?.trim() ||
    flat.match(/DENOMINACI[ÓO]N\s*:\s*([^\n]+)/i)?.[1]?.trim() ||
    '';
  const titular =
    flat.match(/TITULAR\s*:\s*(.+?)\s+DOMICILIO/i)?.[1]?.trim() ||
    flat.match(/TITULAR\s*:\s*([^\n]+)/i)?.[1]?.trim() ||
    '';
  return { denominacion, titular };
}

async function extractPdfFields(file) {
  if (!window.pdfjsLib) return {};
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return parseTituloText(text);
}

function applyExtractedFields(fields) {
  let filled = false;
  if (fields.titular) {
    document.getElementById('t-nombre').value = fields.titular;
    filled = true;
  }
  if (fields.denominacion) {
    document.getElementById('t-marca').value = fields.denominacion;
    filled = true;
  }
  return filled;
}

async function onPdfChange(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('El PDF supera los 2 MB', 'er');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    pdfDataUrl = e.target.result;
    pdfFileName = file.name;
    document.getElementById('pdf-title').textContent = 'PDF seleccionado';
    document.getElementById('pdf-sub').textContent = file.name + ' · ' + Math.round(file.size / 1024) + ' KB';
    const nameEl = document.getElementById('pdf-name');
    nameEl.textContent = '✓ ' + file.name;
    nameEl.classList.remove('hidden');
    document.getElementById('pdf-drop').classList.add('has-file');

    try {
      const fields = await extractPdfFields(file);
      if (applyExtractedFields(fields)) {
        showToast('Titular y denominación extraídos del PDF', 'info');
      } else {
        showToast('No se encontraron titular/denominación — complétalos manualmente', 'er');
      }
    } catch (err) {
      console.warn('PDF parse:', err);
      showToast('No se pudo leer el PDF — complétalos manualmente', 'er');
    }
    buildMsg();
  };
  reader.readAsDataURL(file);
}

function buildMessageText({ titular, denominacion, saludo }) {
  const titularMostrar = titular || '[Titular]';
  const denominacionMostrar = denominacion || '[Denominación]';
  const adjuntoLinea = pdfDataUrl
    ? `\n\n📎 Te adjunto el título oficial en PDF${pdfFileName ? ': ' + pdfFileName : ''}.`
    : '\n\n📎 [Sube el PDF del título de concesión en la sección 1]';

  return (
    `Hola ${titularMostrar} ${saludo}, excelente jornada, viene cargada de buenas noticias 🥳\n\n` +
    `La espera POR FIN terminó, nos acaba de llegar el título oficial de tu marca *${denominacionMostrar}*, ahora sí hemos culminado satisfactoriamente el trámite. ¡Qué felicidad haberte podido servir durante este tiempo! Tu marca se encuentra protegida durante *10 años* y todo ha salido satisfactoriamente. Un abrazo grande y gracias por confiar en nosotros 🥳👏👏\n\n` +
    `Qué alegría haberte podido ayudar durante todo este tiempo, y qué mejor que haber confiado en nosotros. Estamos para servirte y ahora sí, con toda la emoción, *oficialmente tu marca está protegida*. No lo cargues hasta que estés el 95% seguro. Igualmente recuerda que el título tiene toda la validez legal como documento oficial de protección de tu marca.${adjuntoLinea}\n\n` +
    `_Si necesitas algo más, aquí estamos. ¡Mucho éxito con tu emprendimiento!_ 🚀`
  );
}

function buildMsg() {
  const { titular, denominacion } = getFormData();

  const saludos = { am: 'Buenos días', pm: 'Buenas tardes', night: 'Buenas noches' };
  const saludo = saludos[horaChip] || 'Buenos días';

  const msg = buildMessageText({ titular, denominacion, saludo });
  document.getElementById('msg-preview-text').textContent = msg;

  const hayDatos = titular && denominacion;
  const hayPdf = !!pdfDataUrl;
  let status = '';
  if (!titular && !denominacion) status = 'Sube el PDF o completa titular y denominación';
  else if (!titular) status = 'Falta el titular (nombre del cliente)';
  else if (!denominacion) status = 'Falta la denominación de la marca';
  else if (!hayPdf) status = 'Listo — sube el PDF del título';
  else status = '✓ Mensaje listo para copiar';

  const statusEl = document.getElementById('msg-status');
  statusEl.textContent = status;
  statusEl.style.color = hayDatos && hayPdf ? 'var(--ok)' : 'var(--txt2)';
}

function toggleMsgBox() {
  msgVisible = !msgVisible;
  const box = document.getElementById('msg-box');
  const btn = document.getElementById('btn-toggle-msg');
  box.classList.toggle('hidden', !msgVisible);
  btn.classList.toggle('on', msgVisible);
  btn.textContent = msgVisible ? '💬 Ocultar mensaje' : '💬 Mensaje generado';
  if (msgVisible) {
    buildMsg();
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function sendMail() {
  const { titular, denominacion, email } = getFormData();
  buildMsg();
  const msg = document.getElementById('msg-preview-text').textContent;

  if (!email) {
    showToast('Selecciona el correo del cliente', 'er');
    return;
  }
  if (!titular || !denominacion) {
    showToast('Completa titular y denominación', 'er');
    return;
  }
  if (!pdfDataUrl) {
    showToast('Sube el PDF del título antes de enviar', 'er');
    return;
  }

  const pdfBase64 = pdfDataUrl.includes(',') ? pdfDataUrl.split(',')[1] : '';
  if (!pdfBase64) {
    showToast('No se pudo leer el PDF adjunto', 'er');
    return;
  }

  const btn = document.getElementById('btn-send-mail');
  const prevLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  fetch('/api/titulo/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      titular,
      denominacion,
      subject: `Tu título de concesión — ${denominacion}`,
      body: msg,
      pdfBase64,
      pdfFilename: pdfFileName || 'titulo-concesion.pdf',
    }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.error || (res.status === 502 ? 'Error del servidor al contactar Apps Script' : 'No se pudo enviar el correo');
        throw new Error(detail);
      }
      showToast(`Correo enviado a ${email}`);
    })
    .catch((err) => {
      showToast(err.message || 'Error al enviar el correo', 'er');
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = prevLabel;
    });
}

function copyMsgFull() {
  const { titular, denominacion } = getFormData();
  const txt = document.getElementById('msg-preview-text').textContent;
  if (!titular || !denominacion || !txt) {
    showToast('Primero completa titular y denominación', 'er');
    return;
  }
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById('btn-copy-msg');
    const ctxt = document.getElementById('copy-txt');
    btn.classList.add('copied');
    ctxt.textContent = '✓ ¡Copiado!';
    setTimeout(() => {
      btn.classList.remove('copied');
      ctxt.textContent = 'Copiar mensaje completo';
    }, 3000);
    showToast('Mensaje copiado — pégalo en Bitrix');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Mensaje copiado');
    } catch {
      showToast('No se pudo copiar automáticamente', 'er');
    }
    document.body.removeChild(ta);
  });
}

document.querySelectorAll('[data-chip]').forEach((btn) => {
  btn.addEventListener('click', () => setChip(btn.dataset.chip));
});

['t-nombre', 't-marca'].forEach((id) => {
  document.getElementById(id).addEventListener('input', buildMsg);
});
document.getElementById('t-email').addEventListener('change', buildMsg);

document.getElementById('pdf-drop').addEventListener('click', () => {
  document.getElementById('pdf-file').click();
});
document.getElementById('pdf-file').addEventListener('change', function () {
  onPdfChange(this);
});

document.getElementById('btn-regen').addEventListener('click', buildMsg);
document.getElementById('btn-copy-msg').addEventListener('click', copyMsgFull);
document.getElementById('btn-toggle-msg').addEventListener('click', toggleMsgBox);
document.getElementById('btn-send-mail').addEventListener('click', sendMail);

window.addEventListener('load', async () => {
  const h = new Date().getHours();
  if (h >= 12 && h < 18) setChip('pm');
  else if (h >= 18) setChip('night');
  else setChip('am');
  await loadRecentEmails();
  buildMsg();
});
