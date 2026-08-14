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
  'Sofía Becerra',
  'Sofia Becerra',
];

const FIELD_DEFS = {
  cliente: { label: 'Nombre del cliente', aliases: ['NOMBRE DEL CLIENTE', 'CLIENTE', 'SOLICITANTE'] },
  marca: { label: 'Marca', aliases: ['DENOMINACIÓN DEL SIGNO', 'DENOMINACION DEL SIGNO', 'DENOMINACIÓN', 'DENOMINACION', 'MARCA', 'SIGNO'] },
  titular: { label: 'Nombre / razón social', aliases: ['TITULAR', 'RAZÓN SOCIAL', 'RAZON SOCIAL', 'SOLICITANTE'] },
  numero: { label: 'N.º de trámite / registro', aliases: ['NÚMERO DE TRÁMITE', 'NUMERO DE TRAMITE', 'NÚMERO DE SOLICITUD', 'NUMERO DE SOLICITUD', 'N.º DE REGISTRO', 'NO. DE REGISTRO', 'REGISTRO'] },
  clases: { label: 'Clase(s) Niza', aliases: ['CLASES NIZA', 'CLASE NIZA', 'CLASE INTERNACIONAL', 'CLASE'] },
  fecha: { label: 'Fecha', aliases: ['FECHA DE PRESENTACIÓN', 'FECHA DE PRESENTACION', 'FECHA DE RESOLUCIÓN', 'FECHA DE RESOLUCION', 'FECHA'] },
  gaceta: { label: 'Fecha / número de Gaceta', aliases: ['FECHA/PUBLICACIÓN DE GACETA', 'PUBLICACIÓN DE GACETA', 'PUBLICACION DE GACETA', 'NÚMERO DE GACETA', 'NUMERO DE GACETA', 'GACETA'] },
  oponente: { label: 'Nombre del oponente', aliases: ['NOMBRE DEL OPONENTE', 'OPONENTE'] },
  resolucion: { label: 'N.º de resolución', aliases: ['NÚMERO DE RESOLUCIÓN', 'NUMERO DE RESOLUCION', 'N.º DE RESOLUCIÓN', 'RESOLUCIÓN', 'RESOLUCION'] },
  vigencia: { label: 'Vigencia', aliases: ['VIGENCIA', 'FECHA DE INICIO', 'FECHA DE VENCIMIENTO'] },
  fechaInforme: { label: 'Fecha del informe jurídico', aliases: ['FECHA DEL INFORME', 'FECHA DE INFORME', 'FECHA'] },
  asesor: { label: 'Nombre del asesor', aliases: ['ABOGADO A CARGO', 'ABOGADA A CARGO', 'ABOGADO AL CARGO', 'ABOGADO PATROCINADOR', 'NOMBRE DEL ASESOR', 'ASESOR'] },
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

/** Une sílabas partidas por guion al final de línea (p. ej. PA- RRALES → PARRALES). */
function unhyphenatePdfText(text) {
  return String(text || '')
    .replace(/([A-Za-zÁÉÍÓÚáéíóúñÑ])-\s*\r?\n\s*([A-Za-zÁÉÍÓÚáéíóúñÑ])/g, '$1$2')
    .replace(/([A-Za-zÁÉÍÓÚáéíóúñÑ])-\s+([A-Za-zÁÉÍÓÚáéíóúñÑ])/g, '$1$2');
}

function stripMasLogotipo(value) {
  return cleanExtracted(value).replace(/\s+M[AÁ]S\s+LOGOTIPO\s*$/i, '').trim();
}

function extractAfterAliases(text, aliases) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const labels = [
    ...Object.values(FIELD_DEFS).flatMap((d) => d.aliases),
    'TIPO DE SIGNO',
    'PRODUCTOS O SERVICIOS',
    'CLASES NIZA RECOMENDADAS',
    'ABOGADO A CARGO',
    'ABOGADA A CARGO',
    'PROBABILIDAD DE REGISTRO',
  ];
  const stop = [...new Set(labels)].map(escapeRegex).join('|');
  for (const alias of aliases) {
    const pattern = new RegExp(`${escapeRegex(alias)}\\s*[:#.-]?\\s*(.+?)(?=\\s+(?:${stop})\\s*[:#.-]?|$)`, 'i');
    const match = flat.match(pattern);
    if (match && cleanExtracted(match[1]).length <= 180) return cleanExtracted(match[1]);
  }
  return '';
}

function extractAdvisor(text) {
  const flat = text.replace(/\s+/g, ' ').trim();

  // Abogado patrocinador (Formato SENADI / inicio de trámite)
  const patrocinador = flat.split(/Abogado\s+patrocinador/i)[1] || '';
  if (patrocinador) {
    const name = patrocinador.match(
      /Nombre:\s*([A-Za-zÁÉÍÓÚáéíóúñÑ.'-]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ.'-]+){1,4})(?=\s+Direcci[oó]n|\s+Tel[eé]fono|\s+E-mail|\s+Matr[ií]cula|$)/i
    )?.[1];
    if (name) {
      const foldedName = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      const knownPat = ADVISORS.find((n) =>
        foldedName.includes(n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase())
      );
      if (knownPat) {
        const base = knownPat.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        return ADVISORS.find((n) => n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() === base) || knownPat;
      }
      return cleanExtracted(name);
    }
  }

  // Preferir nombre conocido si aparece junto a "ABOGADO A CARGO"
  const cargoChunk = flat.match(/ABOGAD[OA]\s+A(?:L)?\s+CARGO\s*[:.-]?\s*([^●•]{0,80})/i)?.[1] || '';
  if (cargoChunk) {
    const foldedChunk = cargoChunk.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const known = ADVISORS.find((name) =>
      foldedChunk.includes(name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase())
    );
    if (known) {
      const base = known.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      return ADVISORS.find((n) => n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() === base) || known;
    }
  }

  // Tras la etiqueta: solo el nombre (máx. 4 tokens), corta en bullet / LUZ / cargo / etc.
  const labeled = flat.match(
    /ABOGAD[OA]\s+A(?:L)?\s+CARGO\s*[:.-]?\s*(?:Abg\.?\s*)?([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ.'-]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ.'-]+){0,3})(?=\s*(?:●|•|—|--|LUZ|PROBABILIDAD|CLASES|PRODUCTOS|TIPO\s+DE|Abogad[oa]|Resumen|$))/i
  );
  if (labeled) return cleanExtracted(labeled[1]);

  const explicit = extractAfterAliases(text, FIELD_DEFS.asesor.aliases);
  if (explicit) {
    return cleanExtracted(
      explicit
        .replace(/^(?:abg\.?|abogado|abogada)\s+/i, '')
        .replace(/\s*(?:●|•|—|LUZ|PROBABILIDAD|Abogad[oa]).*$/i, '')
    );
  }
  return '';
}

/** Informe BF Ulpik: 3.ª línea = ciudad • fecha; CLIENTE; DENOMINACIÓN DEL SIGNO; ABOGADO A CARGO */
function parseBusquedaFonetica(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const flat = text.replace(/\s+/g, ' ').trim();

  const cliente =
    extractAfterAliases(text, ['NOMBRE DEL CLIENTE', 'CLIENTE']) ||
    flat.match(/\bCLIENTE\s+(.+?)(?=\s+DENOMINACI[ÓO]N\s+DEL\s+SIGNO|\s+TIPO\s+DE\s+SIGNO|$)/i)?.[1] ||
    '';

  const marca =
    extractAfterAliases(text, ['DENOMINACIÓN DEL SIGNO', 'DENOMINACION DEL SIGNO']) ||
    flat.match(/DENOMINACI[ÓO]N\s+DEL\s+SIGNO\s+(.+?)(?=\s+TIPO\s+DE\s+SIGNO|\s+PRODUCTOS|\s+CLASES|\s+ABOGAD|$)/i)?.[1] ||
    '';

  // 3.ª línea del encabezado: "Santa Ana… • 27 de mayo de 2025"
  let fechaInforme = '';
  const headerLine = lines[2] || '';
  const dateFromHeader = headerLine.match(
    /(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i
  );
  if (dateFromHeader) {
    fechaInforme = cleanExtracted(dateFromHeader[1]);
  } else {
    const anyDate = flat.match(
      /(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/i
    );
    if (anyDate) fechaInforme = cleanExtracted(anyDate[1]);
  }

  const asesor = extractAdvisor(text);

  return {
    cliente: cleanExtracted(cliente),
    marca: cleanExtracted(marca),
    fechaInforme,
    asesor,
  };
}

/** Formato Único SENADI — inicio de trámite */
function parseInicioTramite(text) {
  const flat = text.replace(/\s+/g, ' ').trim();

  const numero = (flat.match(/SENADI-\d{4}-\d+/i) || [])[0] || '';

  const fecha =
    flat.match(/Fecha\s+de\s+Presentaci[oó]n[^0-9]{0,40}(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] ||
    flat.match(/SENADI-\d{4}-\d+\s+(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] ||
    '';

  let marca =
    flat.match(
      /Denominaci[oó]n\s+del\s+Signo\s+(.+?)(?=\s+Naturaleza\s+del\s+signo|\s+Tipo\s+de\s+signo|\s+Nacionalidad\s+del\s+Signo)/i
    )?.[1] || '';
  marca = cleanExtracted(marca).replace(/\s+M[AÁ]S\s+LOGOTIPO\s*$/i, '').trim();

  const clases =
    flat.match(/Clasificaci[oó]n\s+Internacional\s+No\.?\s*:\s*(\d+)/i)?.[1] || '';

  // Primer solicitante (antes del abogado patrocinador)
  const solicitantesBlock = flat.split(/Abogado\s+patrocinador/i)[0] || flat;
  const cliente =
    solicitantesBlock.match(
      /Identificaci[oó]n\s+de\s+los\s+solicitantes[\s\S]{0,400}?Nombre:\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s.'-]+?)(?=\s+Direcci[oó]n|\s+Tipo\s+de\s+Documento|\s+E-mail)/i
    )?.[1] ||
    solicitantesBlock.match(/Nombre:\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s.'-]{5,}?)(?=\s+Direcci[oó]n)/i)?.[1] ||
    '';

  return {
    cliente: cleanExtracted(cliente),
    marca: cleanExtracted(marca),
    numero: cleanExtracted(numero),
    fecha: cleanExtracted(fecha),
    clases: cleanExtracted(clases),
    asesor: extractAdvisor(text),
    titular: cleanExtracted(cliente),
  };
}

/** Resolución favorable SENADI */
function parseResolucionFavorable(text) {
  const flat = unhyphenatePdfText(text).replace(/\s+/g, ' ').trim();

  const resolucion =
    flat.match(/N[uú]mero\s+de\s+resoluci[oó]n\s*:\s*(SENADI[_\-]\d{4}[_\-]RS[_\-]\d+)/i)?.[1] ||
    flat.match(/\b(SENADI_\d{4}_RS_\d+)\b/i)?.[1] ||
    '';

  const numero =
    flat.match(/Tr[aá]mite\s+No\.?\s*(SENADI-\d{4}-\d+)/i)?.[1] ||
    flat.match(/solicitud\s+No\.?\s*(SENADI-\d{4}-\d+)/i)?.[1] ||
    (flat.match(/\bSENADI-\d{4}-\d+\b/i) || [])[0] ||
    '';

  let marca =
    flat.match(
      /registro\s+del\s+signo\s*:\s*(.+?)(?=\s+SERVICIO\s+NACIONAL|\s+SENADI\.|-?\s*Quito|\s*,\s*que\s+proteger)/i
    )?.[1] ||
    flat.match(/CONCEDER\s+el\s+registro\s+de\s+(.+?)(?=\s*,\s*en\s+su\s+conjunto)/i)?.[1] ||
    '';
  marca = stripMasLogotipo(marca);

  const cliente =
    flat.match(/presentada\s+por\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s.'-]+?)(?=\s*,\s*el\s+\d)/i)?.[1] ||
    flat.match(/a\s+favor\s+de\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s.'-]+?)(?=\s*,\s*que\s+proteger)/i)?.[1] ||
    '';

  const fecha =
    flat.match(/(?:Quito|Guayaquil|Cuenca)\s*,\s*a\s+(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/i)?.[1] ||
    flat.match(/\ba\s+(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})(?=\s+\d{1,2}h)/i)?.[1] ||
    '';

  return {
    cliente: cleanExtracted(cliente),
    marca: cleanExtracted(marca),
    numero: cleanExtracted(numero),
    resolucion: cleanExtracted(resolucion),
    fecha: cleanExtracted(fecha),
    asesor: extractAdvisor(text),
    titular: cleanExtracted(cliente),
  };
}

/** Título de registro SENADI */
function parseTituloRegistro(text) {
  const flat = unhyphenatePdfText(text).replace(/\s+/g, ' ').trim();

  const numero =
    flat.match(/\b(SENADI_\d{4}_TI_\d+)\b/i)?.[1] ||
    flat.match(/tr[aá]mite\s+n[uú]mero\s+(SENADI-\d{4}-\d+)/i)?.[1] ||
    '';

  let marca =
    flat.match(/DENOMINACI[ÓO]N\s*:\s*(.+?)(?=\s+PRODUCTOS\s+O\s+SERVICIOS|\s+DESCRIPCI[ÓO]N\s*:|\s+VENCIMIENTO\s*:|$)/i)?.[1] || '';
  marca = stripMasLogotipo(marca);

  const titular =
    flat.match(/TITULAR\s*:\s*(.+?)(?=\s+DOMICILIO\s*:|\s+Quito\s*,|\s+Documento\s+firmado|$)/i)?.[1] || '';

  const clases =
    flat.match(/Clase\s+Internacional\s+(?:No\.?\s*)?(\d+)/i)?.[1] ||
    flat.match(/Clasificaci[oó]n\s+Internacional\s+No\.?\s*:?\s*(\d+)/i)?.[1] ||
    '';

  const vencimiento =
    flat.match(/VENCIMIENTO\s*:\s*(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i)?.[1] || '';
  const inicio =
    flat.match(/Resoluci[oó]n\s+No\.?\s*SENADI_\d{4}_RS_\d+\s+de\s+(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/i)?.[1] || '';
  const vigencia = [inicio, vencimiento].filter(Boolean).join(' – ');

  return {
    cliente: cleanExtracted(titular),
    titular: cleanExtracted(titular),
    marca: cleanExtracted(marca),
    numero: cleanExtracted(numero),
    clases: cleanExtracted(clases),
    vigencia: cleanExtracted(vigencia),
    asesor: extractAdvisor(text),
  };
}

function isBusquedaFoneticaPdf(text) {
  return /b[uú]squeda\s+fon[eé]tica/i.test(text) || /INFORME\s+LEGAL\s+[—\-]/i.test(text);
}

function isInicioTramitePdf(text) {
  return /FORMATO\s+[UÚ]NICO\s+DE\s+REGISTRO/i.test(text) ||
    (/No\.\s*de\s+Solicitud/i.test(text) && /SENADI-\d{4}-\d+/i.test(text));
}

function isTituloPdf(text) {
  return /SENADI_\d{4}_TI_\d+/i.test(text) ||
    /OTORGAR\s+el\s+t[ií]tulo/i.test(text) ||
    (/TITULAR\s*:/i.test(text) && /VENCIMIENTO\s*:/i.test(text));
}

function isResolucionPdf(text) {
  return /N[uú]mero\s+de\s+resoluci[oó]n\s*:/i.test(text) ||
    /RESUELVE:\s*CONCEDER/i.test(text) ||
    /SENADI_\d{4}_RS_\d+/i.test(text);
}

const STAGE_PARSERS = {
  busqueda: (text) => {
    const bf = parseBusquedaFonetica(text);
    return { ...bf, titular: bf.cliente, fecha: bf.fechaInforme };
  },
  inicio: parseInicioTramite,
  resolucion: parseResolucionFavorable,
  titulo: parseTituloRegistro,
};

/** El título menciona su resolución de origen, así que se detecta antes que la resolución. */
function detectPdfKind(text) {
  if (isTituloPdf(text)) return 'titulo';
  if (isResolucionPdf(text)) return 'resolucion';
  if (isInicioTramitePdf(text)) return 'inicio';
  if (isBusquedaFoneticaPdf(text)) return 'busqueda';
  return '';
}

function parsePdfFields(text) {
  const parser = STAGE_PARSERS[selectedStage] || STAGE_PARSERS[detectPdfKind(text)];
  if (parser) return parser(text);

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
      credentials: 'same-origin',
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
