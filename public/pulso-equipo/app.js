// ════════════════════════════════════════
//  CONSTANTES Y ESTADO
// ════════════════════════════════════════
const STORAGE_KEY = 'ulpik_pulso_v2';
const PIN_CORRECTO = '3301';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXDdmQxXc3rYh5AWzNCs-nkim8L-1fP8YjWK7_w84b7P9cvGwWLNQjGtj2MLQ1A--_ew/exec';

let remoteDatosCargados = false;
let iaObsCache = {};
let iaObsReqId = 0;

function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = '_ulpikPulso_' + Date.now();
    const timer = setTimeout(() => { cleanup(); reject(new Error('Timeout')); }, 60000);
    const script = document.createElement('script');
    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[cb] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('No se pudo conectar con Apps Script')); };
    const sep = url.includes('?') ? '&' : '?';
    script.src = url + sep + 'callback=' + encodeURIComponent(cb);
    document.head.appendChild(script);
  });
}

async function sincronizarConSheets(respuesta) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PEGAR_URL_AQUI') {
    return { ok: false, reason: 'URL no configurada' };
  }

  const body = JSON.stringify(respuesta);
  const getUrl = APPS_SCRIPT_URL + '?action=save&payload=' + encodeURIComponent(body);
  const postUrl = APPS_SCRIPT_URL + '?action=save';

  // 1) fetch keepalive GET — suele completarse aunque cierren la pestaña
  try {
    fetch(getUrl, {
      method: 'GET',
      keepalive: true,
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit'
    });
    return { ok: true, via: 'keepalive' };
  } catch (e) {
    console.warn('keepalive GET falló:', e);
  }

  // 2) sendBeacon POST — pensado para unload / cierre
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(
        postUrl,
        new Blob([body], { type: 'text/plain;charset=UTF-8' })
      );
      if (queued) return { ok: true, via: 'beacon' };
    }
  } catch (e) {
    console.warn('sendBeacon falló:', e);
  }

  // 3) JSONP — solo con la página abierta (necesitamos respuesta)
  try {
    await fetchJsonp(getUrl);
    return { ok: true, via: 'jsonp' };
  } catch (e) {
    console.warn('Sheets sync error:', e);
    return { ok: false, reason: e.message };
  }
}

async function cargarDatosSheets() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PEGAR_URL_AQUI') return false;
  try {
    const json = await fetchJsonp(APPS_SCRIPT_URL + '?action=get_all');
    if (json.status !== 'ok' || !Array.isArray(json.data)) return false;

    const storage = {};
    json.data.forEach(row => {
      const clave = row.semana || semanaISO(new Date(row.timestamp));
      if (!storage[clave]) storage[clave] = [];
      if (!storage[clave].find(r => r.id == row.id)) {
        storage[clave].push(row);
      }
    });
    saveStorage(storage);
    remoteDatosCargados = true;
    iaObsCache = {};
    return true;
  } catch (e) {
    console.warn('Error cargando datos del Sheet:', e);
    return false;
  }
}

const CATEGORIAS = ['PROCESOS', 'COMUNICACIÓN', 'CARGA DE TRABAJO', 'AMBIENTE', 'SIN SUGERENCIA'];
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

let selectedScore = null;
const selections = { carga: null, claridad: null, mot: null };
let pinIngresado = '';
let pinDesbloqueado = false;

let tabActual = 'semana';
let periodoOffset = 0;

// ════════════════════════════════════════
//  STORAGE — estructura por semana ISO
// ════════════════════════════════════════

function getStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
}

function saveStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function semanaISO(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const wn = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`;
}

function inicioSemanaISO(claveISO) {
  const [yr, wPart] = claveISO.split('-W');
  const year = parseInt(yr, 10);
  const week = parseInt(wPart, 10);
  const jan4 = new Date(year, 0, 4);
  const startOfWeek = new Date(jan4);
  startOfWeek.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + (week - 1) * 7);
  return startOfWeek;
}

function etiquetaSemana(claveISO) {
  const inicio = inicioSemanaISO(claveISO);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  const fmtD = d => `${d.getDate()} ${MESES_ES[d.getMonth()].slice(0, 3)}`;
  return `${fmtD(inicio)} – ${fmtD(fin)} ${fin.getFullYear()}`;
}

function semanaActual() { return semanaISO(new Date()); }
function mesActual() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; }
function anioActual() { return new Date().getFullYear(); }

function todasLasSemanas() {
  return Object.keys(getStorage()).sort().reverse();
}

function getRespuestasSemana(clave) {
  return getStorage()[clave] || [];
}

function getRespuestasMes(mesKey) {
  const data = getStorage();
  const [y, m] = mesKey.split('-').map(Number);
  let res = [];
  Object.entries(data).forEach(([sem, arr]) => {
    const inicio = inicioSemanaISO(sem);
    if (inicio.getFullYear() === y && inicio.getMonth() === m - 1) res = res.concat(arr);
    else {
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      if (fin.getFullYear() === y && fin.getMonth() === m - 1) res = res.concat(arr);
    }
  });
  return res;
}

function semanasDelMes(mesKey) {
  const [y, m] = mesKey.split('-').map(Number);
  return Object.keys(getStorage()).filter(sem => {
    const inicio = inicioSemanaISO(sem);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return (inicio.getFullYear() === y && inicio.getMonth() === m - 1) ||
      (fin.getFullYear() === y && fin.getMonth() === m - 1);
  }).sort();
}

function semanasDelAnio(yr) {
  return Object.keys(getStorage()).filter(sem => sem.startsWith(yr + '-W')).sort();
}

function getRespuestasAnio(yr) {
  const data = getStorage();
  let res = [];
  Object.entries(data).forEach(([sem, arr]) => { if (sem.startsWith(yr + '-W')) res = res.concat(arr); });
  return res;
}

// ════════════════════════════════════════
//  CÁLCULO DE PERÍODO ACTIVO
// ════════════════════════════════════════

function getPeriodoActual() {
  if (tabActual === 'semana') {
    const semanas = todasLasSemanas();
    const hoy = semanaActual();
    const lista = Array.from(new Set([hoy, ...semanas])).sort().reverse();
    const idx = Math.max(0, Math.min(lista.length - 1, -periodoOffset));
    const clave = lista[idx];
    return {
      tipo: 'semana',
      clave,
      label: etiquetaSemana(clave),
      datos: getRespuestasSemana(clave),
      semanas: [clave],
      esActual: clave === hoy,
      totalPeriodos: lista.length,
      idxActual: idx
    };
  }
  if (tabActual === 'mes') {
    const data = getStorage();
    const mesesSet = new Set();
    mesesSet.add(mesActual());
    Object.keys(data).forEach(sem => {
      const ini = inicioSemanaISO(sem);
      mesesSet.add(`${ini.getFullYear()}-${String(ini.getMonth() + 1).padStart(2, '0')}`);
    });
    const lista = Array.from(mesesSet).sort().reverse();
    const idx = Math.max(0, Math.min(lista.length - 1, -periodoOffset));
    const clave = lista[idx];
    const [, m] = clave.split('-').map(Number);
    const label = `${MESES_ES[m - 1]} ${clave.split('-')[0]}`;
    const sems = semanasDelMes(clave);
    return { tipo: 'mes', clave, label, datos: getRespuestasMes(clave), semanas: sems, esActual: clave === mesActual(), totalPeriodos: lista.length, idxActual: idx };
  }
  const data = getStorage();
  const aniosSet = new Set();
  aniosSet.add(String(anioActual()));
  Object.keys(data).forEach(sem => aniosSet.add(sem.split('-W')[0]));
  const lista = Array.from(aniosSet).sort().reverse();
  const idx = Math.max(0, Math.min(lista.length - 1, -periodoOffset));
  const clave = lista[idx];
  const sems = semanasDelAnio(clave);
  return { tipo: 'anio', clave, label: `Año ${clave}`, datos: getRespuestasAnio(Number(clave)), semanas: sems, esActual: clave === String(anioActual()), totalPeriodos: lista.length, idxActual: idx };
}

// ════════════════════════════════════════
//  NAVEGACIÓN
// ════════════════════════════════════════

function setTab(tab) {
  tabActual = tab;
  periodoOffset = 0;
  ['semana', 'mes', 'anio'].forEach(t => document.getElementById('tab-' + t).classList.toggle('active', t === tab));
  renderDashboard();
}

function navPeriod(dir) {
  periodoOffset += dir;
  renderDashboard();
}

// ════════════════════════════════════════
//  RENDER DASHBOARD
// ════════════════════════════════════════

function renderDashboard() {
  const periodo = getPeriodoActual();
  const datos = periodo.datos;
  const total = datos.length;

  document.getElementById('period-label').textContent = periodo.label;
  document.getElementById('sf-kpi-periodo-label').textContent =
    tabActual === 'semana' ? 'Promedio semanal' :
      tabActual === 'mes' ? 'Promedio mensual' : 'Promedio anual';
  document.getElementById('sf-total-sub').textContent =
    tabActual === 'semana' ? 'esta semana' :
      tabActual === 'mes' ? 'este mes' : 'este año';

  document.getElementById('nav-prev').disabled = periodo.idxActual >= periodo.totalPeriodos - 1;
  document.getElementById('nav-next').disabled = periodo.idxActual <= 0;

  const promedio = total > 0 ? datos.reduce((s, d) => s + d.score, 0) / total : null;
  document.getElementById('sf-alert').classList.toggle('active', promedio !== null && promedio < 7);

  const scoreEl = document.getElementById('sf-score-big');
  const fillEl = document.getElementById('sf-progress-fill');
  if (promedio !== null) {
    scoreEl.innerHTML = `${promedio.toFixed(1)}<span class="sf-score-denom">/10</span>`;
    const pct = Math.min(100, (promedio / 10) * 100);
    fillEl.style.width = pct + '%';
    const col = promedio >= 8 ? 'var(--verde)' : promedio >= 6 ? 'var(--amarillo)' : 'var(--rojo)';
    scoreEl.style.color = col;
    fillEl.style.background = col;
  } else {
    scoreEl.innerHTML = '–';
    fillEl.style.width = '0%';
    scoreEl.style.color = 'var(--text-dim)';
  }

  document.getElementById('sf-total').textContent = total;
  document.getElementById('sf-con-sugerencia').textContent = datos.filter(d => d.sugerencia && d.sugerencia.length > 4).length;
  document.getElementById('sf-desbordados').textContent = datos.filter(d => d.carga === 'Desbordante').length;
  document.getElementById('sf-muy-mot').textContent = datos.filter(d => d.motivacion === 'Muy motivado/a').length;
  document.getElementById('sf-sin-claridad').textContent = datos.filter(d => d.claridad === 'No del todo').length;

  let mejorLabel = '–';
  if (periodo.semanas.length > 0) {
    let mejorScore = 0;
    let mejorSem = '';
    periodo.semanas.forEach(s => {
      const rs = getRespuestasSemana(s);
      if (rs.length > 0) {
        const prom = rs.reduce((a, b) => a + b.score, 0) / rs.length;
        if (prom > mejorScore) { mejorScore = prom; mejorSem = s; }
      }
    });
    if (mejorSem) {
      const ini = inicioSemanaISO(mejorSem);
      mejorLabel = `${ini.getDate()} ${MESES_ES[ini.getMonth()].slice(0, 3)} (${mejorScore.toFixed(1)})`;
    }
  }
  document.getElementById('sf-mejor').textContent = mejorLabel;
  document.getElementById('sf-mejor').style.fontSize = mejorLabel.length > 10 ? '13px' : '18px';

  const trendPanel = document.getElementById('sf-trend-panel');
  if (tabActual !== 'semana' && periodo.semanas.length > 1) {
    trendPanel.style.display = 'block';
    document.getElementById('trend-title').textContent =
      tabActual === 'mes' ? 'Evolución semanal del mes' : 'Evolución mensual del año';
    renderTrend(periodo);
  } else {
    trendPanel.style.display = 'none';
  }

  renderBarras('sf-carga-bars',
    ['Manejable', 'Alta pero bien', 'Desbordante'],
    ['verde', 'amarillo', 'rojo'],
    datos, 'carga');

  renderBarras('sf-mot-bars',
    ['Muy motivado/a', 'Motivado/a', 'Regular', 'Desmotivado/a'],
    ['verde', 'verde', 'amarillo', 'rojo'],
    datos, 'motivacion');

  const conSug = datos.filter(d => d.sugerencia && d.sugerencia.length > 4).reverse().slice(0, 3);
  const sugDiv = document.getElementById('sf-sugerencias');
  if (conSug.length === 0) {
    sugDiv.innerHTML = '<div class="sf-empty"><div class="sf-empty-icon">💬</div><p>Sin sugerencias en este período.</p></div>';
  } else {
    sugDiv.innerHTML = conSug.map(d => {
      const fecha = new Date(d.timestamp).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
      return `<div class="sf-sugerencia">"${d.sugerencia}"
        <div class="sf-sugerencia-meta"><span>${d.nombre}</span><span>·</span><span>${fecha}</span><span class="sf-cat-pill">${d.categoria}</span></div>
      </div>`;
    }).join('');
  }

  const catDiv = document.getElementById('sf-categorias');
  const conSugAll = datos.filter(d => d.sugerencia && d.sugerencia.length > 4);
  const catCounts = {};
  CATEGORIAS.filter(c => c !== 'SIN SUGERENCIA').forEach(c => { catCounts[c] = 0; });
  conSugAll.forEach(d => { if (catCounts[d.categoria] !== undefined) catCounts[d.categoria]++; });
  const catItems = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  if (conSugAll.length === 0) {
    catDiv.innerHTML = '<div class="sf-empty"><div class="sf-empty-icon">🏷️</div><p>Sin categorías aún.</p></div>';
  } else {
    catDiv.innerHTML = catItems.map(([cat, n]) => `
      <div class="sf-cat-item"><span class="sf-cat-name">${cat}</span><span class="sf-cat-count">${n}</span></div>
    `).join('');
  }

  renderSeguimientoSensibles(datos);
  cargarObservacionesIA(periodo, datos, promedio);
}

function followupField(d, camel, snake) {
  const val = d[camel] ?? d[snake] ?? '';
  return String(val || '').trim();
}

function renderFollowupComments(containerId, items, emptyIcon, emptyText, tagLabel) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<div class="sf-empty"><div class="sf-empty-icon">${emptyIcon}</div><p>${emptyText}</p></div>`;
    return;
  }
  el.innerHTML = items.slice(0, 8).map(d => {
    const fecha = new Date(d.timestamp).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    const metaExtra = d._metaExtra ? `<span class="sf-cat-pill">${d._metaExtra}</span>` : '';
    return `<div class="sf-sugerencia">
      ${tagLabel ? `<div class="sf-followup-tag">${tagLabel}</div>` : ''}
      "${d._texto}"
      <div class="sf-sugerencia-meta"><span>${d.nombre || 'Anónimo/a'}</span><span>·</span><span>${fecha}</span>${metaExtra}</div>
    </div>`;
  }).join('');
}

function renderSeguimientoSensibles(datos) {
  const motivos = datos
    .map(d => ({
      ...d,
      _texto: followupField(d, 'motivoScore', 'motivo_score'),
      _metaExtra: d.score != null ? `${d.score}/10` : ''
    }))
    .filter(d => d._texto.length > 2 && Number(d.score) <= 5)
    .reverse();

  const cargaComents = datos
    .map(d => ({ ...d, _texto: followupField(d, 'cargaComentario', 'carga_comentario') }))
    .filter(d => d._texto.length > 2)
    .reverse();

  const motComents = datos
    .map(d => ({ ...d, _texto: followupField(d, 'motivacionComentario', 'motivacion_comentario') }))
    .filter(d => d._texto.length > 2)
    .reverse();

  const deptLabels = {
    Procesos: 'Procesos',
    Tecnologia: 'Tecnología',
    Educacion: 'Educación',
    Finanzas: 'Finanzas',
    comercial: 'Comercial',
    legal: 'Legal'
  };

  const depts = datos
    .map(d => {
      const departamento = followupField(d, 'departamento', 'departamento');
      const label = deptLabels[departamento] || departamento;
      return {
        ...d,
        departamento,
        _texto: label ? `Reportó falta de claridad en ${label}` : '',
        _metaExtra: label || ''
      };
    })
    .filter(d => d.departamento)
    .reverse();

  renderFollowupComments(
    'sf-motivos-score',
    motivos,
    '😓',
    'Sin motivos de calificación baja en este período.',
    'Bienestar 1–5'
  );
  renderFollowupComments(
    'sf-carga-comentarios',
    cargaComents,
    '😰',
    'Sin comentarios de carga desbordante en este período.',
    'Sostenibilidad'
  );
  renderFollowupComments(
    'sf-mot-comentarios',
    motComents,
    '😔',
    'Sin comentarios de desmotivación en este período.',
    'Sostenibilidad'
  );

  const deptOrder = ['Procesos', 'Tecnologia', 'Educacion', 'Finanzas', 'comercial', 'legal'];
  const deptCounts = {};
  deptOrder.forEach(k => { deptCounts[k] = 0; });
  depts.forEach(d => {
    if (deptCounts[d.departamento] !== undefined) deptCounts[d.departamento]++;
    else deptCounts[d.departamento] = (deptCounts[d.departamento] || 0) + 1;
  });

  const barsEl = document.getElementById('sf-departamentos-bars');
  if (barsEl) {
    const entries = Object.entries(deptCounts).filter(([, n]) => n > 0);
    if (!entries.length) {
      barsEl.innerHTML = '<div class="sf-empty"><div class="sf-empty-icon">🏢</div><p>Sin departamentos reportados por falta de claridad.</p></div>';
    } else {
      const totalDepts = entries.reduce((s, [, n]) => s + n, 0) || 1;
      barsEl.innerHTML = entries
        .sort((a, b) => b[1] - a[1])
        .map(([key, n]) => {
          const pct = Math.round((n / totalDepts) * 100);
          const label = deptLabels[key] || key;
          return `<div class="sf-bar-row">
            <div class="sf-bar-meta"><span class="sf-bar-name">${label}</span><span class="sf-bar-pct">${n} · ${pct}%</span></div>
            <div class="sf-bar-track"><div class="sf-bar-fill rojo" style="width:${pct}%"></div></div>
          </div>`;
        }).join('');
    }
  }

  const listEl = document.getElementById('sf-departamentos-list');
  if (listEl) {
    if (!depts.length) {
      listEl.innerHTML = '';
    } else {
      renderFollowupComments(
        'sf-departamentos-list',
        depts,
        '❓',
        '',
        'No del todo'
      );
    }
  }
}

function buildObsPayload(periodo, datos, promedio) {
  const conSugAll = datos.filter(d => d.sugerencia && d.sugerencia.length > 4);
  const catCounts = {};
  CATEGORIAS.filter(c => c !== 'SIN SUGERENCIA').forEach(c => { catCounts[c] = 0; });
  conSugAll.forEach(d => { if (catCounts[d.categoria] !== undefined) catCounts[d.categoria]++; });

  return {
    periodo: { tipo: periodo.tipo, label: periodo.label, clave: periodo.clave },
    stats: {
      total: datos.length,
      promedio: promedio != null ? Number(promedio.toFixed(1)) : null,
      conSugerencia: conSugAll.length,
      desbordados: datos.filter(d => d.carga === 'Desbordante').length,
      sinClaridad: datos.filter(d => d.claridad === 'No del todo').length,
      muyMotivados: datos.filter(d => d.motivacion === 'Muy motivado/a').length
    },
    respuestas: datos.map(d => ({
      score: d.score,
      carga: d.carga,
      claridad: d.claridad,
      motivacion: d.motivacion
    })),
    sugerencias: conSugAll.map(d => ({ texto: d.sugerencia, categoria: d.categoria || 'SIN SUGERENCIA' })),
    categorias: catCounts
  };
}

function observacionLocal(payload) {
  const s = payload.stats;
  if (!s.total) {
    return {
      resumen: 'No hay respuestas en este período. Invita al equipo a completar el pulso semanal.',
      senales_positivas: [],
      senales_alerta: [],
      acciones_recomendadas: ['Enviar recordatorio del check-in semanal.']
    };
  }
  const alertas = [];
  const positivas = [];
  const acciones = [];
  if (s.promedio >= 8) positivas.push(`Bienestar promedio sólido (${s.promedio}/10).`);
  else if (s.promedio < 7) alertas.push(`Promedio de bienestar bajo (${s.promedio}/10), por debajo de la meta de 8.`);
  if (s.desbordados) alertas.push(`${s.desbordados} persona(s) reportan carga desbordante.`);
  if (s.sinClaridad) alertas.push(`${s.sinClaridad} persona(s) sin claridad total en su rol.`);
  if (s.muyMotivados) positivas.push(`${s.muyMotivados} persona(s) muy motivadas esta semana.`);
  if (s.conSugerencia) acciones.push('Revisar las sugerencias escritas y dar seguimiento visible al equipo.');
  if (s.desbordados) acciones.push('Conversar con quienes reportan sobrecarga para repriorizar entregables.');
  if (s.promedio < 7) acciones.push('Agendar espacio de escucha con el equipo en los próximos días.');
  if (!acciones.length) acciones.push('Mantener el ritmo y celebrar los avances con el equipo.');

  return {
    resumen: s.promedio >= 8
      ? `El equipo muestra un pulso saludable con ${s.total} respuesta(s) y promedio ${s.promedio}/10.`
      : s.promedio >= 7
        ? `Pulso estable (${s.promedio}/10) con ${s.total} respuesta(s). Hay margen para reforzar bienestar hacia la meta de 8.`
        : `El pulso requiere atención: promedio ${s.promedio}/10 con ${s.total} respuesta(s).`,
    senales_positivas: positivas,
    senales_alerta: alertas,
    acciones_recomendadas: acciones
  };
}

function renderObservacionesPanel(obs, fallback) {
  const el = document.getElementById('sf-ia-content');
  if (!el) return;
  const list = (items, empty) => items.length
    ? items.map(i => `<li>${i}</li>`).join('')
    : `<li class="muted">${empty}</li>`;

  el.innerHTML = `
    ${fallback ? '<div class="sf-ia-error" style="margin-bottom:10px;">⚠️ Modo local — no se pudo conectar con OpenAI vía Apps Script.</div>' : ''}
    <div class="sf-ia-resumen">${obs.resumen || '—'}</div>
    <div class="sf-ia-cols">
      <div class="sf-ia-col positiva">
        <h4>Señales positivas</h4>
        <ul>${list(obs.senales_positivas || [], 'Sin señales destacadas.')}</ul>
      </div>
      <div class="sf-ia-col alerta">
        <h4>Alertas</h4>
        <ul>${list(obs.senales_alerta || [], 'Sin alertas relevantes.')}</ul>
      </div>
      <div class="sf-ia-col accion">
        <h4>Acciones recomendadas</h4>
        <ul>${list(obs.acciones_recomendadas || [], 'Sin acciones sugeridas.')}</ul>
      </div>
    </div>
  `;
}

async function cargarObservacionesIA(periodo, datos, promedio) {
  const el = document.getElementById('sf-ia-content');
  if (!el) return;

  const cacheKey = `${tabActual}:${periodo.clave}:${datos.length}:${promedio != null ? promedio.toFixed(1) : 'na'}`;
  if (iaObsCache[cacheKey]) {
    renderObservacionesPanel(iaObsCache[cacheKey].obs, iaObsCache[cacheKey].fallback);
    return;
  }

  const reqId = ++iaObsReqId;
  el.innerHTML = '<div class="sf-ia-loading"><svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Generando observaciones con IA…</div>';

  const payload = buildObsPayload(periodo, datos, promedio);

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PEGAR_URL_AQUI') {
    const obs = observacionLocal(payload);
    iaObsCache[cacheKey] = { obs, fallback: true };
    if (reqId === iaObsReqId) renderObservacionesPanel(obs, true);
    return;
  }

  try {
    const url = APPS_SCRIPT_URL + '?action=observe&payload=' + encodeURIComponent(JSON.stringify(payload));
    const json = await fetchJsonp(url);
    if (reqId !== iaObsReqId) return;
    if (json.status === 'error') throw new Error(json.message || 'Error de IA');
    const obs = json.observaciones || observacionLocal(payload);
    iaObsCache[cacheKey] = { obs, fallback: false };
    renderObservacionesPanel(obs, false);
  } catch (e) {
    console.warn('Observaciones IA:', e);
    if (reqId !== iaObsReqId) return;
    const obs = observacionLocal(payload);
    iaObsCache[cacheKey] = { obs, fallback: true };
    renderObservacionesPanel(obs, true);
  }
}

function renderBarras(id, opts, colors, datos, campo) {
  const total = datos.length;
  const div = document.getElementById(id);
  if (total === 0) { div.innerHTML = '<div class="sf-empty"><div class="sf-empty-icon">📭</div><p>Sin datos</p></div>'; return; }
  div.innerHTML = opts.map((opt, i) => {
    const n = datos.filter(d => d[campo] === opt).length;
    const pct = Math.round((n / total) * 100);
    return `<div class="sf-bar-row">
      <div class="sf-bar-meta"><span class="sf-bar-name">${opt}</span><span class="sf-bar-pct">${pct}%</span></div>
      <div class="sf-bar-track"><div class="sf-bar-fill ${colors[i]}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function renderTrend(periodo) {
  const chart = document.getElementById('trend-chart');
  let puntos = [];

  if (tabActual === 'mes') {
    puntos = periodo.semanas.map(s => {
      const rs = getRespuestasSemana(s);
      const prom = rs.length > 0 ? rs.reduce((a, b) => a + b.score, 0) / rs.length : null;
      const ini = inicioSemanaISO(s);
      return { label: `${ini.getDate()}/${ini.getMonth() + 1}`, val: prom, n: rs.length };
    });
  } else {
    const mesesMap = {};
    periodo.semanas.forEach(s => {
      const ini = inicioSemanaISO(s);
      const mk = `${ini.getFullYear()}-${String(ini.getMonth() + 1).padStart(2, '0')}`;
      if (!mesesMap[mk]) mesesMap[mk] = [];
      mesesMap[mk] = mesesMap[mk].concat(getRespuestasSemana(s));
    });
    puntos = Object.entries(mesesMap).sort().map(([mk, rs]) => {
      const [, m] = mk.split('-');
      const prom = rs.length > 0 ? rs.reduce((a, b) => a + b.score, 0) / rs.length : null;
      return { label: MESES_ES[parseInt(m, 10) - 1].slice(0, 3), val: prom, n: rs.length };
    });
  }

  if (puntos.length === 0) { chart.innerHTML = ''; return; }
  const maxVal = 10;
  chart.innerHTML = puntos.map(p => {
    const pct = p.val ? Math.round((p.val / maxVal) * 100) : 0;
    const col = !p.val ? 'var(--dark-3)' : p.val >= 8 ? 'var(--verde)' : p.val >= 6 ? 'var(--amarillo)' : 'var(--rojo)';
    const valLabel = p.val ? p.val.toFixed(1) : '–';
    return `<div class="trend-bar-wrap">
      <div class="trend-bar-val">${valLabel}</div>
      <div class="trend-bar-outer">
        <div class="trend-bar-inner" style="height:${pct}%;background:${col}"></div>
      </div>
      <div class="trend-bar-label">${p.label}</div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════
//  FORMULARIO
// ════════════════════════════════════════

function buildScoreGrid() {
  const grid = document.getElementById('score-grid');
  if (!grid || grid.children.length > 0) return;
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'score-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => selectScore(i, btn));
    grid.appendChild(btn);
  }
}

function buildPinPad() {
  const pad = document.getElementById('pin-pad');
  if (!pad || pad.children.length > 0) return;

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    { val: 'cancel', label: 'Cancelar', extraClass: 'borrar' },
    '0',
    { val: 'del', label: '⌫', extraClass: 'borrar' }
  ];

  keys.forEach(k => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const val = typeof k === 'object' ? k.val : k;
    btn.className = 'pin-key' + (typeof k === 'object' && k.extraClass ? ' ' + k.extraClass : '');
    btn.textContent = typeof k === 'object' ? k.label : k;
    btn.addEventListener('click', () => pinKey(val));
    pad.appendChild(btn);
  });
}

function setFollowupVisible(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden', !visible);
  if (!visible) {
    el.querySelectorAll('textarea, select, input').forEach((field) => {
      field.value = '';
    });
  }
}

function updateFollowups() {
  setFollowupVisible('followup-score', selectedScore !== null && selectedScore <= 5);
  setFollowupVisible('followup-carga', selections.carga === 'Desbordante');
  setFollowupVisible('followup-claridad', selections.claridad === 'No del todo');
  setFollowupVisible('followup-mot', selections.mot === 'Desmotivado/a');
}

function selectScore(val, btn) {
  selectedScore = val;
  document.querySelectorAll('.score-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  updateFollowups();
}

function selectOpt(group, btn) {
  document.querySelectorAll(`#${group}-group .opt-btn`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selections[group] = btn.dataset.val;
  updateFollowups();
}

async function clasificarSugerencia(texto) {
  if (!texto || texto.trim().length < 5) return null;
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PEGAR_URL_AQUI') return null;
  try {
    const url = APPS_SCRIPT_URL + '?action=classify&payload=' + encodeURIComponent(JSON.stringify({ texto }));
    const data = await fetchJsonp(url);
    if (data.status === 'error') throw new Error(data.message);
    const cat = String(data.categoria || '').trim().toUpperCase();
    return CATEGORIAS.includes(cat) ? cat : null;
  } catch (e) {
    console.warn('Clasificación IA:', e);
    return null;
  }
}

function feedbackLocal(respuesta) {
  const tips = [];
  if (respuesta.score <= 5) {
    tips.push('Tu bienestar esta semana está en zona de atención — es válido sentirte así.');
  }
  if (respuesta.carga === 'Desbordante') {
    tips.push('Con carga desbordante, conviene hablar con tu líder para repriorizar entregables urgentes.');
  } else if (respuesta.carga === 'Alta pero bien') {
    tips.push('La semana fue intensa: protege al menos un bloque de descanso sin reuniones.');
  }
  if (respuesta.claridad === 'No del todo') {
    tips.push('Pide una conversación breve sobre expectativas y prioridades de tu rol.');
  } else if (respuesta.claridad === 'A veces') {
    tips.push('Anota las dudas concretas de la semana y compártelas en tu próximo 1:1.');
  }
  if (respuesta.motivacion === 'Desmotivado/a') {
    tips.push('Identifica una tarea pequeña que te dé sentido, o pide apoyo a alguien de confianza del equipo.');
  } else if (respuesta.motivacion === 'Regular') {
    tips.push('Un cambio pequeño en tu rutina (pausas, orden de tareas) puede ayudar a recuperar energía.');
  }
  return {
    mensaje: respuesta.score <= 5
      ? 'Gracias por compartir con honestidad. Tu pulso importa y el equipo puede actuar con esta información.'
      : 'Gracias por tu check-in semanal.',
    recomendacion: tips.length
      ? tips.join(' ')
      : 'Si algo te pesa, este espacio está para expresarlo — no tienes que cargarlo solo/a.'
  };
}

function feedbackPositivoLocal(respuesta) {
  if (respuesta.score >= 8) {
    return {
      mensaje: '¡Buen pulso esta semana! Tu bienestar se ve sólido.',
      recomendacion: 'Sigue cuidando tu ritmo. Si algo cambia, aquí puedes registrarlo de inmediato.'
    };
  }
  return {
    mensaje: 'Gracias por completar tu pulso.',
    recomendacion: 'Hay margen para subir el bienestar hacia 8/10. Pequeños ajustes en carga o claridad pueden marcar la diferencia.'
  };
}

async function obtenerFeedbackPulso(respuesta) {
  if (respuesta.score > 5) {
    return { feedback: feedbackPositivoLocal(respuesta), ia: false };
  }
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PEGAR_URL_AQUI') {
    return { feedback: feedbackLocal(respuesta), ia: false };
  }
  try {
    const url = APPS_SCRIPT_URL + '?action=feedback&payload=' + encodeURIComponent(JSON.stringify({
      score: respuesta.score,
      carga: respuesta.carga,
      claridad: respuesta.claridad,
      motivacion: respuesta.motivacion,
      sugerencia: respuesta.sugerencia || ''
    }));
    const data = await fetchJsonp(url);
    if (data.status === 'error') throw new Error(data.message);
    if (data.feedback && data.feedback.mensaje) {
      return { feedback: data.feedback, ia: true };
    }
    throw new Error('Respuesta vacía');
  } catch (e) {
    console.warn('Feedback IA:', e);
    return { feedback: feedbackLocal(respuesta), ia: false };
  }
}

function withTimeout(promise, ms, fallback) {
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; resolve(fallback); }
    }, ms);
    Promise.resolve(promise).then(
      v => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } },
      () => { if (!settled) { settled = true; clearTimeout(timer); resolve(fallback); } }
    );
  });
}

function renderThanksFeedback(respuesta, feedbackResult) {
  const esBajo = respuesta.score <= 5;
  const fb = feedbackResult && feedbackResult.feedback;
  const fbWrap = document.getElementById('thanks-feedback-wrap');
  if (!fbWrap || !fb) return;
  const fbClass = esBajo ? 'alerta' : respuesta.score >= 8 ? 'positiva' : '';
  fbWrap.innerHTML = `
    <div class="eq-thanks-feedback ${fbClass}">
      <div class="eq-thanks-feedback-label">${esBajo ? '💡 Para ti esta semana' : '✨ Reflexión rápida'}</div>
      <p class="eq-thanks-feedback-msg">${fb.mensaje}</p>
      <div class="eq-thanks-feedback-rec"><strong>Recomendación:</strong> ${fb.recomendacion}</div>
    </div>
  `;
}

function renderThanksCategoria(respuesta, categoria) {
  const catWrap = document.getElementById('thanks-cat-wrap');
  if (!catWrap) return;
  if (respuesta.sugerencia && respuesta.sugerencia.length >= 5 && categoria) {
    catWrap.innerHTML = `<div class="eq-thanks-cat">💬 Tu sugerencia · ${categoria}</div>`;
  } else {
    catWrap.innerHTML = '';
  }
}

function mostrarPantallaGracias(respuesta, categoria, feedbackResult) {
  const esBajo = respuesta.score <= 5;
  const iconEl = document.querySelector('#eq-thanks .eq-thanks-icon');
  const titleEl = document.querySelector('#eq-thanks h2');
  const descEl = document.querySelector('#eq-thanks p');

  if (iconEl) iconEl.textContent = esBajo ? '🤝' : '🎉';
  if (titleEl) titleEl.textContent = esBajo ? 'Gracias por tu honestidad' : '¡Gracias por tu pulso!';
  if (descEl) {
    descEl.textContent = esBajo
      ? 'Tu respuesta ayuda al equipo a entender cómo están las cosas y tomar acción.'
      : 'Tu respuesta ayuda al equipo a tomar mejores decisiones. Cada semana contamos.';
  }

  document.getElementById('eq-form').style.display = 'none';
  document.getElementById('eq-hero').style.display = 'none';
  document.getElementById('eq-thanks').classList.add('active');

  const scoreEl = document.getElementById('thanks-score');
  scoreEl.textContent = respuesta.score + '/10';
  scoreEl.style.color = esBajo ? '#DC2626' : respuesta.score >= 8 ? '#16A34A' : 'var(--naranja)';

  renderThanksFeedback(respuesta, feedbackResult);
  renderThanksCategoria(respuesta, categoria);
}

async function enviarFormulario() {
  if (!selectedScore) { alert('Por favor selecciona tu puntuación de bienestar (1-10)'); return; }
  if (!selections.carga) { alert('Por favor indica tu carga de trabajo'); return; }
  if (!selections.claridad) { alert('Por favor responde sobre la claridad de tu rol'); return; }
  if (!selections.mot) { alert('Por favor indica tu motivación'); return; }

  const motivoScore = document.getElementById('inp-motivo-score')?.value.trim() || '';
  const cargaComentario = document.getElementById('inp-carga-comentario')?.value.trim() || '';
  const departamento = document.getElementById('sel-departamento')?.value || '';
  const motComentario = document.getElementById('inp-mot-comentario')?.value.trim() || '';

  if (selectedScore <= 5 && motivoScore.length < 3) {
    alert('Cuéntanos el motivo de tu calificación (pregunta 1).');
    document.getElementById('inp-motivo-score')?.focus();
    return;
  }
  if (selections.carga === 'Desbordante' && cargaComentario.length < 3) {
    alert('Cuéntanos cómo podemos mejorar desde sostenibilidad (pregunta 2).');
    document.getElementById('inp-carga-comentario')?.focus();
    return;
  }
  if (selections.claridad === 'No del todo' && !departamento) {
    alert('Selecciona el departamento al que perteneces (pregunta 3).');
    document.getElementById('sel-departamento')?.focus();
    return;
  }
  if (selections.mot === 'Desmotivado/a' && motComentario.length < 3) {
    alert('Cuéntanos cómo podemos mejorar desde sostenibilidad (pregunta 4).');
    document.getElementById('inp-mot-comentario')?.focus();
    return;
  }

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  const sugerencia = document.getElementById('inp-sugerencia').value.trim();
  const nombre = document.getElementById('inp-nombre').value.trim();

  const respuesta = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    nombre: nombre || 'Anónimo/a',
    score: selectedScore,
    carga: selections.carga,
    claridad: selections.claridad,
    motivacion: selections.mot,
    motivoScore: selectedScore <= 5 ? motivoScore : '',
    cargaComentario: selections.carga === 'Desbordante' ? cargaComentario : '',
    departamento: selections.claridad === 'No del todo' ? departamento : '',
    motivacionComentario: selections.mot === 'Desmotivado/a' ? motComentario : '',
    sugerencia: sugerencia,
    categoria: 'SIN SUGERENCIA'
  };

  // Feedback local inmediato — no bloquea por OpenAI
  const feedbackLocalResult = {
    feedback: selectedScore > 5 ? feedbackPositivoLocal(respuesta) : feedbackLocal(respuesta),
    ia: false
  };

  const data = getStorage();
  const clave = semanaActual();
  if (!data[clave]) data[clave] = [];
  data[clave].push(respuesta);
  saveStorage(data);
  iaObsCache = {};

  mostrarPantallaGracias(respuesta, null, feedbackLocalResult);

  // Guardar en Sheets YA (keepalive/beacon) — no esperar a OpenAI
  sincronizarConSheets(respuesta).then(result => {
    if (!result.ok) console.warn('No se pudo sincronizar con Sheets:', result.reason);
    else console.log('✅ Respuesta guardada en Google Sheets', result.via || '');
  });

  // Clasificar solo para UI / localStorage (no re-guardar: evita filas duplicadas)
  if (sugerencia.length >= 5) {
    clasificarSugerencia(sugerencia).then(cat => {
      if (!cat) return;
      respuesta.categoria = cat;
      const stored = getStorage();
      const list = stored[clave] || [];
      const row = list.find(r => r.id === respuesta.id);
      if (row) row.categoria = cat;
      saveStorage(stored);
      renderThanksCategoria(respuesta, cat);
    }).catch(() => {});
  }

  if (selectedScore <= 5) {
    obtenerFeedbackPulso(respuesta).then(fb => {
      if (fb && fb.ia) renderThanksFeedback(respuesta, fb);
    }).catch(() => {});
  }
}

// ════════════════════════════════════════
//  LIMPIAR SEMANA ACTUAL
// ════════════════════════════════════════

function confirmarLimpiar() { document.getElementById('modal-limpiar').classList.add('active'); }

function cerrarModal() {
  document.getElementById('modal-limpiar').classList.remove('active');
  document.getElementById('modal-pin').classList.remove('active');
}

function limpiarSemanaActual() {
  const data = getStorage();
  const clave = semanaActual();
  delete data[clave];
  saveStorage(data);
  cerrarModal();
  periodoOffset = 0;
  renderDashboard();
}

// ════════════════════════════════════════
//  PIN
// ════════════════════════════════════════

function solicitarPIN() {
  if (pinDesbloqueado) { cambiarVista('sofia'); return; }
  pinIngresado = '';
  actualizarDots();
  document.getElementById('pin-error').textContent = '';
  document.getElementById('modal-pin').classList.add('active');
}

function pinKey(val) {
  if (val === 'cancel') { document.getElementById('modal-pin').classList.remove('active'); return; }
  if (val === 'del') { pinIngresado = pinIngresado.slice(0, -1); actualizarDots(); return; }
  if (pinIngresado.length >= 4) return;
  pinIngresado += val;
  actualizarDots();
  if (pinIngresado.length === 4) validarPIN();
}

function actualizarDots() {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('pd-' + i);
    d.classList.toggle('filled', i < pinIngresado.length);
    d.classList.remove('error');
  }
}

function validarPIN() {
  if (pinIngresado === PIN_CORRECTO) {
    pinDesbloqueado = true;
    document.getElementById('modal-pin').classList.remove('active');
    cambiarVista('sofia');
  } else {
    for (let i = 0; i < 4; i++) document.getElementById('pd-' + i).classList.add('error');
    document.getElementById('pin-error').textContent = 'PIN incorrecto. Intenta de nuevo.';
    setTimeout(() => { pinIngresado = ''; actualizarDots(); }, 800);
  }
}

// ════════════════════════════════════════
//  SWITCHER DE VISTA
// ════════════════════════════════════════

function cambiarVista(vista) {
  document.body.classList.remove('vista-equipo', 'vista-sofia');
  document.body.classList.add('vista-' + vista);
  document.getElementById('app-equipo').style.display = vista === 'equipo' ? 'block' : 'none';
  document.getElementById('app-sofia').style.display = vista === 'sofia' ? 'block' : 'none';
  document.getElementById('vs-equipo').classList.toggle('active', vista === 'equipo');
  document.getElementById('vs-sofia').classList.toggle('active', vista === 'sofia');
  if (vista === 'sofia') {
    showSfLoading(true);
    cargarYRenderizar();
  } else {
    showSfLoading(false);
  }
}

function showSfLoading(show) {
  const el = document.getElementById('sf-loading');
  if (el) el.classList.toggle('hidden', !show);
}

async function cargarYRenderizar() {
  await cargarDatosSheets();
  renderDashboard();
  showSfLoading(false);
}

function wireEvents() {
  document.getElementById('vs-equipo').addEventListener('click', () => cambiarVista('equipo'));
  document.getElementById('vs-sofia').addEventListener('click', solicitarPIN);
  document.getElementById('btn-submit').addEventListener('click', enviarFormulario);
  document.getElementById('btn-clear-header').addEventListener('click', confirmarLimpiar);
  document.getElementById('btn-clear-footer').addEventListener('click', confirmarLimpiar);
  document.getElementById('btn-modal-cancel').addEventListener('click', cerrarModal);
  document.getElementById('btn-modal-confirm').addEventListener('click', limpiarSemanaActual);

  document.querySelectorAll('.sf-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => setTab(tab.dataset.tab));
  });

  document.getElementById('nav-prev').addEventListener('click', () => navPeriod(-1));
  document.getElementById('nav-next').addEventListener('click', () => navPeriod(1));

  document.querySelectorAll('.opt-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => selectOpt(btn.dataset.group, btn));
  });
}

function init() {
  document.body.classList.add('vista-equipo');
  document.getElementById('app-equipo').style.display = 'block';
  document.getElementById('app-sofia').style.display = 'none';
  buildScoreGrid();
  buildPinPad();
  wireEvents();
}

init();
