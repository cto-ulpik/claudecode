let horaChip = 'am';
let pdfDataUrl = '';

function showToast(msg, t = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = (t === 'ok' ? '✓  ' : t === 'er' ? '✗  ' : 'ℹ  ') + msg;
  el.className = 'toast show ' + t;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 5000);
}

function setChip(tipo) {
  horaChip = tipo;
  ['am', 'pm', 'night'].forEach((c) => {
    document.getElementById('chip-' + c).classList.toggle('on', c === tipo);
  });
  buildMsg();
}

function onPdfChange(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    showToast('El PDF supera los 20 MB', 'er');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    pdfDataUrl = e.target.result;
    document.getElementById('pdf-title').textContent = 'PDF seleccionado';
    document.getElementById('pdf-sub').textContent = file.name + ' · ' + Math.round(file.size / 1024) + ' KB';
    const nameEl = document.getElementById('pdf-name');
    nameEl.textContent = '✓ ' + file.name;
    nameEl.classList.remove('hidden');
    document.getElementById('pdf-drop').classList.add('has-file');
    buildMsg();
  };
  reader.readAsDataURL(file);
}

function buildMsg() {
  const nombre = (document.getElementById('t-nombre')?.value || '').trim();
  const marca = (document.getElementById('t-marca')?.value || '').trim();
  const link = (document.getElementById('t-link')?.value || '').trim();

  const saludos = { am: 'Buenos días', pm: 'Buenas tardes', night: 'Buenas noches' };
  const saludo = saludos[horaChip] || 'Buenos días';
  const nombreMostrar = nombre || '[Nombre del cliente]';
  const marcaMostrar = marca || '[Nombre de la marca]';

  let enlaceLinea = '';
  if (link && link.startsWith('http')) {
    enlaceLinea = '\n\n🔗 Aquí tienes el acceso a tu título oficial:\n' + link;
  } else if (pdfDataUrl) {
    enlaceLinea = '\n\n📎 Te adjunto el título oficial en PDF.';
  } else {
    enlaceLinea = '\n\n📎 [Adjunta el PDF del título aquí]';
  }

  const msg =
    `Hola ${nombreMostrar} ${saludo}, excelente jornada, viene cargada de buenas noticias 🥳\n\n` +
    `La espera POR FIN terminó, nos acaba de llegar el título oficial de tu marca *${marcaMostrar}*, ahora sí hemos culminado satisfactoriamente el trámite. ¡Qué felicidad haberte podido servir durante este tiempo! Tu marca se encuentra protegida durante *10 años* y todo ha salido satisfactoriamente. Un abrazo grande y gracias por confiar en nosotros 🥳👏👏\n\n` +
    `Qué alegría haberte podido ayudar durante todo este tiempo, y qué mejor que haber confiado en nosotros. Estamos para servirte y ahora sí, con toda la emoción, *oficialmente tu marca está protegida*. No lo cargues hasta que estés el 95% seguro. Igualmente recuerda que el título tiene toda la validez legal como documento oficial de protección de tu marca.${enlaceLinea}\n\n` +
    `_Si necesitas algo más, aquí estamos. ¡Mucho éxito con tu emprendimiento!_ 🚀`;

  document.getElementById('msg-preview-text').textContent = msg;

  const hayDatos = nombre && marca;
  const hayEnlace = link || pdfDataUrl;
  let status = '';
  if (!nombre && !marca) status = 'Completa el nombre del cliente y la marca';
  else if (!nombre) status = 'Falta el nombre del cliente';
  else if (!marca) status = 'Falta el nombre de la marca';
  else if (!hayEnlace) status = 'Listo — agrega el enlace o PDF del título';
  else status = '✓ Mensaje listo para copiar';

  const statusEl = document.getElementById('msg-status');
  statusEl.textContent = status;
  statusEl.style.color = hayDatos && hayEnlace ? 'var(--ok)' : 'var(--txt2)';
}

function copyMsgFull() {
  const txt = document.getElementById('msg-preview-text').textContent;
  if (!txt || txt.includes('Completa los datos')) {
    showToast('Primero completa los datos del cliente', 'er');
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

['t-nombre', 't-email', 't-marca', 't-link'].forEach((id) => {
  document.getElementById(id).addEventListener('input', buildMsg);
});

document.getElementById('pdf-drop').addEventListener('click', () => {
  document.getElementById('pdf-file').click();
});
document.getElementById('pdf-file').addEventListener('change', function () {
  onPdfChange(this);
});

document.getElementById('btn-regen').addEventListener('click', buildMsg);
document.getElementById('btn-copy-msg').addEventListener('click', copyMsgFull);

window.addEventListener('load', () => {
  const h = new Date().getHours();
  if (h >= 12 && h < 18) setChip('pm');
  else if (h >= 18) setChip('night');
  else setChip('am');
  buildMsg();
});
