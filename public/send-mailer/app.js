let selectedStage = 'busqueda';
let oppositionType = 'sin';
let pdfDataUrl = '';
let pdfFileName = '';
let pdfText = '';
let previewDirty = false;

const ADVISORS = [
  'Esteban Maldonado',
  'Martín Coello',
  'Sebastián López',
  'Sebastian López',
  'Javier España',
  'Marianela Espinoza',
];

const FIELD_DEFS = {
  cliente: { label: 'Nombre del cliente', aliases: ['NOMBRE DEL CLIENTE', 'CLIENTE', 'SOLICITANTE'] },
  marca: { label: 'Marca', aliases: ['DENOMINACIÓN', 'DENOMINACION', 'MARCA', 'SIGNO'] },
  titular: { label: 'Nombre / razón social', aliases: ['TITULAR', 'RAZÓN SOCIAL', 'RAZON SOCIAL', 'SOLICITANTE'] },
  numero: { label: 'N.º de trámite / registro', aliases: ['NÚMERO DE TRÁMITE', 'NUMERO DE TRAMITE', 'NÚMERO DE SOLICITUD', 'NUMERO DE SOLICITUD', 'N.º DE REGISTRO', 'NO. DE REGISTRO', 'REGISTRO'] },
  clases: { label: 'Clase(s) Niza', aliases: ['CLASES NIZA', 'CLASE NIZA', 'CLASE INTERNACIONAL', 'CLASE'] },
  fecha: { label: 'Fecha', aliases: ['FECHA DE PRESENTACIÓN', 'FECHA DE PRESENTACION', 'FECHA DE RESOLUCIÓN', 'FECHA DE RESOLUCION', 'FECHA'] },
  gaceta: { label: 'Fecha / número de Gaceta', aliases: ['FECHA/PUBLICACIÓN DE GACETA', 'PUBLICACIÓN DE GACETA', 'PUBLICACION DE GACETA', 'NÚMERO DE GACETA', 'NUMERO DE GACETA', 'GACETA'] },
  oponente: { label: 'Nombre del oponente', aliases: ['NOMBRE DEL OPONENTE', 'OPONENTE'] },
  resolucion: { label: 'N.º de resolución', aliases: ['NÚMERO DE RESOLUCIÓN', 'NUMERO DE RESOLUCION', 'N.º DE RESOLUCIÓN', 'RESOLUCIÓN', 'RESOLUCION'] },
  vigencia: { label: 'Vigencia', aliases: ['VIGENCIA', 'FECHA DE INICIO', 'FECHA DE VENCIMIENTO'] },
  fechaInforme: { label: 'Fecha del informe jurídico', aliases: ['FECHA DEL INFORME', 'FECHA DE INFORME', 'FECHA'] },
  asesor: { label: 'Nombre del asesor', aliases: ['NOMBRE DEL ASESOR', 'ASESOR'] },
};

const STAGES = {
  busqueda: {
    label: 'Búsqueda fonética',
    fields: ['cliente', 'marca', 'fechaInforme', 'asesor'],
    subject: '🔎 Informe de búsqueda fonética de [MARCA]',
    body: `Hola [NOMBRE DEL CLIENTE],

¡Tenemos novedades sobre tu marca [MARCA]! 🙌

Hemos completado la búsqueda fonética, el primer paso de nuestro proceso de registro.

¿Para qué sirve esta búsqueda? Nos permite identificar marcas registradas o solicitadas previamente que puedan presentar similitudes con [MARCA] y, a partir de ello, evaluar preliminarmente posibles riesgos antes de presentar la solicitud de registro.

Este correo tiene por objeto enviar un respaldo de los documentos e instrucciones que recibirás paralelamente por WhatsApp; por ese medio podremos conversar sobre cuáles son los siguientes pasos en tu proceso. Aquí encontrarás:

El informe jurídico generado para tu marca en fecha [FECHA].
Un archivo de Excel donde verás todas las marcas encontradas que tienen similitud con la tuya.
Un arte informativo con nuestra política de garantía y los tiempos del proceso de registro de marca.

Desde ULPIK te acompañaremos durante cada etapa para que sepas qué está pasando y qué viene después.

Un abrazo,
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
  },
  inicio: {
    label: 'Inicio de trámite',
    fields: ['cliente', 'marca', 'numero', 'fecha', 'clases', 'asesor'],
    subject: '🚀 ¡Tu registro de marca [MARCA] ya inició oficialmente!',
    body: `Hola [NOMBRE DEL CLIENTE],

¡Tenemos una excelente noticia! 🙌

La solicitud de registro de tu marca [MARCA] ya fue presentada ante el Servicio Nacional de Derechos Intelectuales (SENADI) y cuenta con un número de trámite asignado.

Estos son los datos que identifican tu solicitud:

Marca: [MARCA]
N.º de trámite: [NÚMERO]
Fecha de presentación: [FECHA]
Clase(s): [CLASE/S NIZA]

Esto significa que el procedimiento administrativo de registro ya está en marcha.

Ahora SENADI continuará con las etapas correspondientes de revisión de la solicitud. Nosotros estaremos pendientes del expediente y te informaremos cuando exista un avance relevante.

Por el momento, no necesitas realizar ninguna acción adicional, salvo que tu asesor te indique lo contrario vía WhatsApp.

¡Seguimos avanzando! 🚀
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
  },
  publicacion: {
    label: 'Publicación en Gaceta',
    fields: ['cliente', 'marca', 'numero', 'gaceta', 'asesor'],
    subject: '📢 Tu marca [MARCA] avanzó a publicación',
    body: `Hola [NOMBRE DEL CLIENTE],

¡Tu proceso sigue avanzando! 🙌

La solicitud de registro de [MARCA] ha llegado a la etapa de publicación en la Gaceta de Propiedad Intelectual.

¿Qué significa esto?

La publicación permite que terceros conozcan la existencia de la solicitud y, si consideran que el registro podría afectar derechos que poseen, puedan presentar una oposición dentro del término previsto para esta etapa.

Es una etapa normal del procedimiento y no significa que exista actualmente una oposición contra tu marca.

Los datos de tu proceso son:

Marca: [MARCA]
N.º de trámite: [NÚMERO]
Fecha/publicación de Gaceta: [FECHA / NÚMERO DE GACETA]

¿Qué debes hacer ahora?

Nada por el momento. Desde ULPIK estaremos pendientes del desarrollo de esta etapa y te notificaremos una vez concluya o si se presenta alguna novedad que requiera nuestra intervención.

Cada vez estamos más cerca. 💪
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
  },
  fin_gaceta: {
    label: 'Fin de Gaceta',
    fields: ['cliente', 'marca', 'asesor'],
    subject: '✅ Buenas noticias: [MARCA] superó su etapa de publicación sin oposiciones',
    body: `Hola [NOMBRE DEL CLIENTE],

¡Tenemos buenas noticias sobre [MARCA]! 🎉

Ha finalizado la etapa correspondiente de publicación sin que se haya presentado una oposición contra tu solicitud.

¿Qué significa esto?

Tu proceso puede continuar hacia las siguientes etapas de análisis por parte de SENADI.

Es un avance importante, aunque todavía no significa que la marca haya sido concedida. La autoridad deberá continuar con el análisis correspondiente antes de emitir su decisión.

Por ahora no necesitas hacer nada. Nuestro equipo continuará dando seguimiento al expediente y te informaremos cuando tengamos el siguiente avance.

¡Seguimos avanzando juntos! 🙌
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
    opposition: {
      fields: ['cliente', 'marca', 'numero', 'oponente', 'asesor'],
      subject: '⚠️ Actualización importante sobre el registro de [MARCA]',
      body: `Hola [NOMBRE DEL CLIENTE],

Queremos informarte de una novedad importante dentro del proceso de registro de [MARCA].

Durante la etapa correspondiente se ha presentado una oposición contra la solicitud de registro de tu marca.

Una oposición significa que un tercero ha manifestado ante SENADI que considera que existen razones por las cuales tu solicitud no debería ser concedida.

Esto no significa automáticamente que tu marca haya sido negada. La oposición forma parte del procedimiento y deberá ser analizada y resuelta por la autoridad.

Los datos principales son:

Marca: [MARCA]
N.º de trámite: [NÚMERO]
Oponente: [NOMBRE DEL OPONENTE]

Te adjuntamos el documento aquí para que puedas conocerlo. Para cuando recibas este correo nuestro equipo legal ya se habrá puesto en contacto contigo para explicarte el escenario y los próximos pasos de manera clara.

Seguimos acompañándote durante todo el proceso.
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
    },
  },
  resolucion: {
    label: 'Resolución favorable',
    fields: ['cliente', 'marca', 'numero', 'resolucion', 'fecha', 'asesor'],
    subject: '🎉 ¡SENADI resolvió favorablemente el registro de [MARCA]!',
    body: `Hola [NOMBRE DEL CLIENTE],

¡Llegó una de las noticias que estábamos esperando! 🎉

SENADI ha emitido una resolución favorable respecto de la solicitud de registro de [MARCA].

Después de avanzar por las distintas etapas del procedimiento, la autoridad ha resuelto favorablemente tu solicitud.

Marca: [MARCA]
N.º de trámite: [NÚMERO]
N.º de resolución: [NÚMERO DE RESOLUCIÓN]
Fecha: [FECHA]

Este es uno de los hitos más importantes del proceso. 🙌

¿Qué sigue?

Ahora continuaremos con las actuaciones correspondientes hasta contar con el título de registro, documento que acredita formalmente el derecho concedido sobre la marca.

No necesitas realizar ninguna gestión adicional en este momento, salvo que tu asesor te indique lo contrario.

¡Estamos muy cerca de finalizar! 🚀
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
  },
  titulo: {
    label: 'Título de registro',
    fields: ['cliente', 'marca', 'titular', 'numero', 'clases', 'vigencia', 'asesor'],
    subject: '🎉 El título de registro de [MARCA] ya está disponible',
    body: `Hola [NOMBRE DEL CLIENTE],

¡Lo logramos! 🎉

Después de acompañarte durante todo el proceso, nos alegra contarte que el título de registro de tu marca [MARCA] ya está disponible.

Este documento acredita el registro concedido sobre tu marca para los productos y/o servicios protegidos, conforme al alcance establecido por SENADI.

Marca: [MARCA]
Titular: [NOMBRE / RAZÓN SOCIAL]
N.º de registro: [NÚMERO]
Clase(s): [CLASE/S NIZA]
Vigencia: [FECHA DE INICIO – FECHA DE VENCIMIENTO]

Te adjuntamos el título en formato PDF a continuación.

Te recomendamos guardar una copia del título para cualquier eventualidad. A partir de ahora comienza una nueva etapa: usar, cuidar y gestionar adecuadamente tu marca como un activo de tu negocio.

Gracias por confiar en ULPIK para acompañarte en este proceso. 💚

¡Felicitaciones por este gran paso!
[NOMBRE DEL ASESOR]
Equipo ULPIK`,
  },
};

const PLACEHOLDERS = {
  cliente: '[NOMBRE DEL CLIENTE]',
  marca: '[MARCA]',
  titular: '[NOMBRE / RAZÓN SOCIAL]',
  numero: '[NÚMERO]',
  clases: '[CLASE/S NIZA]',
  fecha: '[FECHA]',
  gaceta: '[FECHA / NÚMERO DE GACETA]',
  oponente: '[NOMBRE DEL OPONENTE]',
  resolucion: '[NÚMERO DE RESOLUCIÓN]',
  vigencia: '[FECHA DE INICIO – FECHA DE VENCIMIENTO]',
  fechaInforme: '[FECHA]',
  asesor: '[NOMBRE DEL ASESOR]',
};

function activeTemplate() {
  const stage = STAGES[selectedStage];
  return selectedStage === 'fin_gaceta' && oppositionType === 'con' ? stage.opposition : stage;
}

function showToast(message, type = 'ok') {
  const toast = document.getElementById('toast');
  toast.textContent = (type === 'er' ? '✗ ' : '✓ ') + message;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 5000);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanExtracted(value) {
  return String(value || '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:.-]+|[\s;,.]+$/g, '')
    .trim();
}

function extractAfterAliases(text, aliases) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const labels = Object.values(FIELD_DEFS).flatMap((d) => d.aliases);
  const stop = labels.map(escapeRegex).join('|');
  for (const alias of aliases) {
    const pattern = new RegExp(`${escapeRegex(alias)}\\s*[:#.-]?\\s*(.+?)(?=\\s+(?:${stop})\\s*[:#.-]|$)`, 'i');
    const match = flat.match(pattern);
    if (match && cleanExtracted(match[1]).length <= 180) return cleanExtracted(match[1]);
  }
  return '';
}

function extractAdvisor(text) {
  const explicit = extractAfterAliases(text, FIELD_DEFS.asesor.aliases);
  if (explicit) return explicit;
  const folded = text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return ADVISORS.find((name) =>
    folded.includes(name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase())
  ) || '';
}

function parsePdfFields(text) {
  const result = {};
  Object.entries(FIELD_DEFS).forEach(([key, def]) => {
    result[key] = key === 'asesor' ? extractAdvisor(text) : extractAfterAliases(text, def.aliases);
  });

  if (!result.cliente) result.cliente = result.titular;
  if (!result.titular) result.titular = result.cliente;

  const start = text.match(/(?:FECHA DE INICIO|DESDE)\s*[:.-]?\s*([0-9/.-]{6,20})/i)?.[1] || '';
  const end = text.match(/(?:FECHA DE VENCIMIENTO|HASTA)\s*[:.-]?\s*([0-9/.-]{6,20})/i)?.[1] || '';
  if (start || end) result.vigencia = [start, end].filter(Boolean).join(' – ');

  return result;
}

function fieldValue(key) {
  return (document.getElementById(`field-${key}`)?.value || '').trim();
}

function interpolate(source) {
  let output = source;
  activeTemplate().fields.forEach((key) => {
    const placeholder = PLACEHOLDERS[key];
    const value = fieldValue(key) || placeholder;
    output = output.split(placeholder).join(value);
  });
  return output;
}

function renderStages() {
  const grid = document.getElementById('stage-grid');
  grid.innerHTML = Object.entries(STAGES).map(([key, stage]) =>
    `<button type="button" class="stage ${key === selectedStage ? 'on' : ''}" data-stage="${key}">${stage.label}</button>`
  ).join('');
  grid.querySelectorAll('.stage').forEach((button) => {
    button.addEventListener('click', () => {
      selectedStage = button.dataset.stage;
      previewDirty = false;
      renderStages();
      renderFields(pdfText ? parsePdfFields(pdfText) : {});
      updatePreview(true);
    });
  });
  document.getElementById('opposition-wrap').classList.toggle('hidden', selectedStage !== 'fin_gaceta');
}

function renderFields(values = {}) {
  const fields = activeTemplate().fields;
  const grid = document.getElementById('fields-grid');
  const current = {};
  grid.querySelectorAll('[data-field]').forEach((input) => { current[input.dataset.field] = input.value; });
  grid.innerHTML = fields.map((key) => {
    const def = FIELD_DEFS[key];
    const value = values[key] ?? current[key] ?? '';
    return `<label class="dynamic-field">
      <span>${def.label} *</span>
      <input class="input" id="field-${key}" data-field="${key}" value="${String(value).replace(/"/g, '&quot;')}" placeholder="Extraído del PDF">
    </label>`;
  }).join('');
  grid.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('input', () => updatePreview());
  });
  document.getElementById('advisor-warning').classList.toggle('hidden', !fields.includes('asesor') || !!fieldValue('asesor'));
}

function updatePreview(force = false) {
  const subject = interpolate(activeTemplate().subject);
  const body = interpolate(activeTemplate().body);
  document.getElementById('subject').value = subject;
  if (force || !previewDirty) document.getElementById('body-preview').value = body;
  document.getElementById('advisor-warning').classList.toggle('hidden', !activeTemplate().fields.includes('asesor') || !!fieldValue('asesor'));
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) throw new Error('No se cargó el lector de PDF');
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    content.items.forEach((item) => {
      text += item.str + (item.hasEOL ? '\n' : ' ');
    });
    text += '\n';
  }
  return text;
}

async function processPdf(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    showToast('El PDF supera los 10 MB', 'er');
    return;
  }

  pdfFileName = file.name;
  pdfDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  document.getElementById('pdf-drop').classList.add('has-file');
  document.getElementById('pdf-title').textContent = file.name;
  document.getElementById('pdf-sub').textContent = `${Math.round(file.size / 1024)} KB · Procesando…`;
  document.getElementById('extract-status').textContent = 'Extrayendo texto del PDF…';

  try {
    pdfText = await extractPdfText(file);
    const values = parsePdfFields(pdfText);
    renderFields(values);
    previewDirty = false;
    updatePreview(true);
    const count = activeTemplate().fields.filter((key) => values[key]).length;
    document.getElementById('extract-status').textContent = `${count} de ${activeTemplate().fields.length} campos reconocidos`;
    document.getElementById('pdf-sub').textContent = `${Math.round(file.size / 1024)} KB · PDF listo`;
    showToast('PDF procesado; revisa los datos extraídos');
  } catch (error) {
    console.warn('[send-mailer] PDF:', error);
    document.getElementById('extract-status').textContent = 'No se pudo extraer texto; revisa si el PDF es escaneado';
    showToast('No se pudo leer el texto del PDF', 'er');
  }
}

async function sendEmail() {
  const recipient = document.getElementById('recipient').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const body = document.getElementById('body-preview').value.trim();
  const missing = activeTemplate().fields.filter((key) => !fieldValue(key));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return showToast('Ingresa un destinatario válido', 'er');
  if (!pdfDataUrl) return showToast('Adjunta el PDF de respaldo', 'er');
  if (missing.length) return showToast(`Revisa los campos faltantes: ${missing.map((key) => FIELD_DEFS[key].label).join(', ')}`, 'er');
  if (!subject || !body) return showToast('Falta asunto o mensaje', 'er');

  const button = document.getElementById('btn-send');
  button.disabled = true;
  button.textContent = 'Enviando…';
  try {
    const response = await fetch('/api/send-mailer/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient,
        stage: selectedStage,
        variant: selectedStage === 'fin_gaceta' ? oppositionType : '',
        subject,
        body,
        htmlBody: body.split('\n').map((line) => line || '<br>').join('<br>'),
        pdfBase64: pdfDataUrl.split(',')[1],
        pdfFilename: pdfFileName || 'documento-senadi.pdf',
        fields: Object.fromEntries(activeTemplate().fields.map((key) => [key, fieldValue(key)])),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No se pudo enviar el correo');
    showToast(`Correo enviado a ${recipient}`);
  } catch (error) {
    showToast(error.message || 'Error al enviar', 'er');
  } finally {
    button.disabled = false;
    button.textContent = '✉️ Enviar correo con PDF';
  }
}

document.getElementById('opposition-type').addEventListener('change', (event) => {
  oppositionType = event.target.value;
  previewDirty = false;
  renderFields(pdfText ? parsePdfFields(pdfText) : {});
  updatePreview(true);
});
const pdfDrop = document.getElementById('pdf-drop');
pdfDrop.addEventListener('click', () => document.getElementById('pdf-file').click());
pdfDrop.addEventListener('dragover', (event) => {
  event.preventDefault();
  pdfDrop.classList.add('has-file');
});
pdfDrop.addEventListener('dragleave', () => {
  if (!pdfDataUrl) pdfDrop.classList.remove('has-file');
});
pdfDrop.addEventListener('drop', (event) => {
  event.preventDefault();
  processPdf(event.dataTransfer.files[0]);
});
document.getElementById('pdf-file').addEventListener('change', (event) => processPdf(event.target.files[0]));
document.getElementById('btn-reextract').addEventListener('click', () => {
  if (!pdfText) return showToast('Primero adjunta un PDF', 'er');
  renderFields(parsePdfFields(pdfText));
  previewDirty = false;
  updatePreview(true);
});
document.getElementById('body-preview').addEventListener('input', () => { previewDirty = true; });
document.getElementById('btn-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById('body-preview').value);
    showToast('Mensaje copiado');
  } catch {
    showToast('No se pudo copiar el mensaje', 'er');
  }
});
document.getElementById('btn-send').addEventListener('click', sendEmail);

renderStages();
renderFields();
updatePreview(true);
