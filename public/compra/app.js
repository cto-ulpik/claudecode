const LOCAL_SK = 'ulpik_compra_local';
const STORAGE_KEY = 'ulpik_compra_v1';

const CARGO_FEM = 'Abogada y Asesora Comercial';
const CARGO_MASC = 'Abogado y Asesor Comercial';
const CARGO_MARTIN = 'Abogado y jefe de marcas de Ulpik';
const SERVICIO_REGISTRO = 'Registro de marca';

let ASESORES = {};

async function loadAsesores() {
  try {
    const res = await fetch('asesores.json?v=20260722');
    if (!res.ok) throw new Error('json');
    ASESORES = await res.json();
  } catch {
    const sebastian = {
      asesor: 'Sebastián Lopez',
      foto: 'asesores/sebastian.jpeg',
      cargo: CARGO_MASC,
      mensaje:
        'Bienvenido, qué gusto poderte atender. Estoy seguro de que te podré ayudar durante todo tu proceso.',
      video: 'asesores/presentacion/sebastian-web.m4v',
      titulo: 'Mensaje de tu asesor',
    };
    ASESORES = {
      'Esteban Maldonado (Estebitan)': { ...sebastian },
      'Marianela Espinoza (Nela)': { ...sebastian },
      'Sebastián Lopez (Sebas)': { ...sebastian },
      'Javier España (Javi)': {
        asesor: 'Javier España',
        foto: '',
        cargo: CARGO_MASC,
        mensaje:
          'Bienvenido, qué gusto poderte atender. Estoy seguro de que te podré ayudar durante todo tu proceso.',
        video: 'asesores/presentacion/javier-web.m4v',
        titulo: 'Mensaje de tu asesor',
      },
      'Martín Coello (Martín)': {
        asesor: 'Martín Coello',
        foto: 'asesores/martin.jpg',
        cargo: CARGO_MARTIN,
        mensaje:
          'Bienvenido, qué gusto poderte atender. Estoy seguro de que te podré ayudar durante todo tu proceso.',
        video: 'asesores/presentacion/martin-web.m4v',
        titulo: 'Mensaje de tu asesor',
      },
    };
  }
}

function asesorIniciales(nombre) {
  return String(nombre || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function asesorCargo(info) {
  if (info?.cargo) return info.cargo;
  const nombre = info?.asesor || '';
  if (/mart[ií]n/i.test(nombre)) return CARGO_MARTIN;
  return /marianela/i.test(nombre) ? CARGO_FEM : CARGO_MASC;
}

function isRegistroMarca() {
  return fd.servicio === SERVICIO_REGISTRO;
}

function successMessageForService() {
  if (fd.servicio === SERVICIO_REGISTRO) {
    return 'Hemos iniciado el primer paso del proceso de registro marcario.<br><strong>Gracias por confiar en nosotros.</strong>';
  }
  if (fd.servicio === 'Constitución de S.A.S') {
    return 'Hemos recibido tu calificación. Nuestro equipo seguirá acompañándote en la constitución de tu S.A.S.<br><strong>Gracias por confiar en nosotros.</strong>';
  }
  return 'Hemos recibido tu calificación. Tu opinión nos ayuda a mejorar cada proceso.<br><strong>Gracias por confiar en nosotros.</strong>';
}

function setAsesorAvatar(el, info) {
  const foto = String(info.foto || '').trim();
  el.replaceChildren();
  el.className = 'asesor-avatar';
  el.style.cursor = '';

  if (!foto) {
    el.classList.add('initials');
    el.textContent = asesorIniciales(info.asesor);
    return;
  }

  const img = document.createElement('img');
  img.src = foto;
  img.alt = info.asesor;
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    el.replaceChildren();
    el.className = 'asesor-avatar initials';
    el.textContent = asesorIniciales(info.asesor);
    el.style.cursor = '';
  });
  img.addEventListener('click', () => openLightbox(foto, info.asesor));
  el.appendChild(img);
  el.style.cursor = 'pointer';
  el.title = 'Ver foto de ' + info.asesor;
}

function openLightbox(src, name) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb-name').textContent = name;
  document.getElementById('lb').classList.add('open');
  document.body.style.overflow = 'hidden';
}

const NPS = [
  '',
  'Lamentamos no cumplir tus expectativas.',
  'Gracias por ser honesto.',
  'Gracias por tu respuesta.',
  'Gracias, seguiremos mejorando.',
  'Buen punto de partida.',
  'Seguiremos trabajando.',
  '¡Qué bueno saberlo!',
  '¡Nos alegra mucho!',
  '¡Genial!',
  '¡Eso lo es todo para nosotros! 🙌',
];

const SCALE_FIELDS = [
  { id: 'sc-facilidad', msg: 'sm-facilidad', f: 'facilidad' },
  { id: 'sc-claridad', msg: 'sm-claridad', f: 'claridad' },
  { id: 'sc-atencion', msg: 'sm-atencion', f: 'atencion' },
  { id: 'sc-nps', msg: 'sm-nps', f: 'nps' },
];

const fd = {
  email: '',
  servicio: '',
  facilidad: 0,
  facilidadMejora: '',
  claridad: 0,
  dificultad: '',
  atencion: 0,
  acomp: '',
  nps: 0,
  asesor: '',
  mejora: '',
};

async function saveSurvey(entry) {
  try {
    const res = await fetch('/api/compra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo guardar la encuesta');
    }
    return;
  } catch (err) {
    let arr = [];
    try {
      const raw = localStorage.getItem(LOCAL_SK);
      if (raw) arr = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    arr.push(entry);
    localStorage.setItem(LOCAL_SK, JSON.stringify(arr));
    if (err instanceof Error && err.message !== 'No se pudo guardar la encuesta') throw err;
  }
}

function showToast(msg, t = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + (t || '');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

function facilidadMejoraOk() {
  if (fd.facilidad === 10) return true;
  if (fd.facilidad > 0 && fd.facilidad < 10) {
    return String(fd.facilidadMejora || '').trim().length >= 5;
  }
  return true;
}

function isDone(f) {
  const v = fd[f];
  if (f === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (f === 'facilidad') return fd.facilidad > 0 && facilidadMejoraOk();
  if (typeof v === 'number') return v > 0;
  return String(v || '').length > 0;
}

function markD(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  const ok = val && (typeof val === 'number' ? val > 0 : String(val).length > 0);
  if (ok) {
    el.classList.add('done');
    el.classList.remove('bad');
    const num = el.querySelector('.stp-num');
    if (num) num.textContent = '✓';
  } else {
    el.classList.remove('done');
  }
}

function upP() {
  const fields = ['email', 'servicio', 'facilidad', 'claridad', 'dificultad', 'atencion', 'acomp', 'nps', 'asesor', 'mejora'];
  const done = fields.filter((f) => isDone(f)).length;
  const pct = Math.round((done / fields.length) * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-lbl').textContent = done + ' de ' + fields.length + ' completadas';
}

function onEI() {
  fd.email = document.getElementById('f-email').value.trim();
  markD('s-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email) ? fd.email : '');
  upP();
}

function onMI() {
  const t = document.getElementById('f-mejora');
  fd.mejora = t.value;
  document.getElementById('char-n').textContent = String(t.value.length);
  markD('s-mejora', t.value.length >= 5 ? t.value : '');
  upP();
}

function toggleFacilidadMejora() {
  const box = document.getElementById('fu-facilidad');
  const inp = document.getElementById('f-facilidad-mejora');
  if (!box || !inp) return;
  const need = fd.facilidad > 0 && fd.facilidad < 10;
  box.classList.toggle('show', need);
  if (!need) {
    box.classList.remove('bad');
    if (fd.facilidad === 10) {
      inp.value = '';
      fd.facilidadMejora = '';
    }
  }
}

function onFacilidadMejora() {
  const t = document.getElementById('f-facilidad-mejora');
  fd.facilidadMejora = t ? t.value : '';
  const box = document.getElementById('fu-facilidad');
  if (box) box.classList.toggle('bad', fd.facilidad > 0 && fd.facilidad < 10 && fd.facilidadMejora.trim().length < 5);
  markD('s-facilidad', isDone('facilidad') ? fd.facilidad : '');
  upP();
}

function validate() {
  const checks = [
    { f: 'email', s: 's-email' },
    { f: 'servicio', s: 's-servicio' },
    { f: 'facilidad', s: 's-facilidad' },
    { f: 'claridad', s: 's-claridad' },
    { f: 'dificultad', s: 's-dificultad' },
    { f: 'atencion', s: 's-atencion' },
    { f: 'acomp', s: 's-acomp' },
    { f: 'nps', s: 's-nps' },
    { f: 'asesor', s: 's-asesor' },
    { f: 'mejora', s: 's-mejora' },
  ];
  let ok = true;
  let first = null;
  checks.forEach(({ f, s }) => {
    const el = document.getElementById(s);
    if (!isDone(f)) {
      el.classList.add('bad');
      if (f === 'facilidad') {
        const fu = document.getElementById('fu-facilidad');
        if (fu) fu.classList.toggle('bad', fd.facilidad > 0 && !facilidadMejoraOk());
      }
      if (!first) first = el;
      ok = false;
    } else {
      el.classList.remove('bad');
      if (f === 'facilidad') document.getElementById('fu-facilidad')?.classList.remove('bad');
    }
  });
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return ok;
}

const VIDEO_VOLUME = 0.35;

function getAsesorVideo() {
  return document.getElementById('cf-video');
}

function stopAsesorVideo() {
  const video = getAsesorVideo();
  if (!video) return;
  video.pause();
  video.removeAttribute('src');
  video.load();
}

/** Desbloquea audio con el clic de envío para poder autoplay con volumen. */
function unlockAsesorVideo(src) {
  const video = getAsesorVideo();
  if (!video || !src) return;
  video.muted = false;
  video.volume = VIDEO_VOLUME;
  if (video.src !== new URL(src, location.href).href) {
    video.src = src;
    video.load();
  }
  const p = video.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      video.pause();
      video.currentTime = 0;
    }).catch(() => {});
  }
}

function playAsesorVideo(src) {
  const video = getAsesorVideo();
  if (!video || !src) return;
  video.muted = false;
  video.volume = VIDEO_VOLUME;
  if (video.src !== new URL(src, location.href).href) {
    video.src = src;
    video.load();
  }
  const tryPlay = () =>
    video.play().catch(() => {
      video.muted = true;
      return video.play().then(() => {
        video.muted = false;
        video.volume = VIDEO_VOLUME;
      }).catch(() => {});
    });
  if (video.readyState >= 2) tryPlay();
  else video.addEventListener('canplay', tryPlay, { once: true });
}

function showSplashThenSuccess() {
  const sp = document.createElement('div');
  sp.className = 'check-splash';
  sp.innerHTML =
    '<div class="splash-c"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
  document.body.appendChild(sp);
  setTimeout(() => {
    sp.remove();
    showSuccess();
  }, 2100);
}

function showSuccess() {
  ['survey-form', 'prog-wrap', 'hero-section'].forEach((id) => {
    document.getElementById(id).style.display = 'none';
  });

  const fw = document.querySelector('.fw');
  const bottom = document.getElementById('succ-bottom');
  const block = document.getElementById('asesor-block');
  const vidCol = document.getElementById('vid-col');
  const showWelcome = isRegistroMarca();
  const info = showWelcome ? ASESORES[fd.asesor] : null;

  document.getElementById('succ-sub').innerHTML = successMessageForService();

  if (showWelcome) {
    fw?.classList.add('succ-wide');
    fw?.classList.remove('succ-simple');
    bottom.classList.remove('hidden');
  } else {
    fw?.classList.remove('succ-wide');
    fw?.classList.add('succ-simple');
    bottom.classList.add('hidden');
    block.classList.add('hidden');
    vidCol.classList.add('hidden');
    stopAsesorVideo();
  }

  if (showWelcome && info) {
    document.getElementById('a-titulo').textContent = info.titulo || 'Mensaje de tu asesor';
    setAsesorAvatar(document.getElementById('a-avatar'), info);
    document.getElementById('a-name').textContent = info.asesor;
    document.getElementById('a-role').textContent = asesorCargo(info);
    document.getElementById('a-quote').textContent = info.mensaje;
    document.getElementById('a-sig').innerHTML = '— <span>' + info.asesor + '</span>, Ulpik';
    block.classList.remove('hidden');
    vidCol.classList.remove('hidden');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        playAsesorVideo(info.video || '');
      })
    );
  } else if (showWelcome) {
    block.classList.add('hidden');
    vidCol.classList.add('hidden');
    stopAsesorVideo();
  }

  document.getElementById('succ').classList.add('show');
  setTimeout(() => document.getElementById('succ').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

async function submitForm() {
  if (!validate()) {
    showToast('⚠ Completa los campos obligatorios', 'er');
    return;
  }

  const btn = document.getElementById('btn-sub');
  btn.classList.add('loading');
  btn.disabled = true;
  document.getElementById('btn-txt').textContent = 'Enviando…';

  if (isRegistroMarca()) {
    unlockAsesorVideo(ASESORES[fd.asesor]?.video || '');
  }

  const payload = { ...fd, ts: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  try {
    await saveSurvey(payload);
    showSplashThenSuccess();
  } catch (err) {
    console.warn('[compra] save:', err);
    showToast(err instanceof Error ? err.message : 'No se pudo guardar la encuesta', 'er');
    btn.classList.remove('loading');
    btn.disabled = false;
    document.getElementById('btn-txt').textContent = 'Enviar mi calificación →';
  }
}

function closeLightbox() {
  document.getElementById('lb').classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('load', () => {
  loadAsesores();
  SCALE_FIELDS.forEach((sc) => {
    const wrap = document.getElementById(sc.id);
    if (!wrap) return;
    for (let i = 1; i <= 10; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sbtn';
      b.textContent = String(i);
      b.addEventListener('click', (e) => {
        e.preventDefault();
        fd[sc.f] = i;
        wrap.querySelectorAll('.sbtn').forEach((x, j) => x.classList.toggle('sel', j + 1 === i));
        if (sc.f === 'facilidad') toggleFacilidadMejora();
        markD('s-' + sc.f, sc.f === 'facilidad' ? (isDone('facilidad') ? i : '') : i);
        const sm = document.getElementById(sc.msg);
        if (sm) {
          sm.textContent = sc.f === 'nps' ? NPS[i] || i + '/10' : i + '/10';
          sm.className = 'score-msg set';
        }
        upP();
      });
      wrap.appendChild(b);
    }
  });

  document.querySelectorAll('.opt').forEach((o) => {
    o.addEventListener('click', () => {
      const g = o.dataset.group;
      document.querySelectorAll('.opt[data-group="' + g + '"]').forEach((x) => x.classList.remove('sel'));
      o.classList.add('sel');
      fd[g] = o.dataset.val;
      markD('s-' + g, o.dataset.val);
      upP();
    });
  });

  document.getElementById('f-email').addEventListener('input', onEI);
  document.getElementById('f-mejora').addEventListener('input', onMI);
  document.getElementById('f-facilidad-mejora').addEventListener('input', onFacilidadMejora);
  document.getElementById('btn-sub').addEventListener('click', submitForm);
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb').addEventListener('click', (e) => {
    if (e.target.id === 'lb') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});
