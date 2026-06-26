const LOCAL_SK = 'ulpik_compra_local';
const STORAGE_KEY = 'ulpik_compra_v1';
const CF =
  'https://customer-ovyrjx6190a92qae.cloudflarestream.com/52dc80f8e5baea490cbc57fddfc781ba/iframe?autoplay=1&preload=true&loop=false&startTime=0s&controls=true';

const ASESORES = {
  'Esteban Maldonado': ['EM', 'Esteban Maldonado', 'Abogado y Asesor Comercial', 'Estebitan a tu disposición en cada paso del proceso marcario. Cualquier duda que tengas, estoy aquí para ti.'],
  'Javier España': ['JE', 'Javier España', 'Abogado y Asesor Comercial', 'Javi listo para guiarte en todo el proceso. Fue un placer acompañarte en esta decisión.'],
  'Marianela Espinoza': ['ME', 'Marianela Espinoza', 'Abogada y Asesora Comercial', 'Nela de tu lado, asegurándonos de que tu trámite avance sin contratiempos. ¡Gracias por confiar!'],
  'Martín Coello': ['MC', 'Martín Coello', 'Abogado y Asesor Comercial', 'Bienvenido, qué gusto poderte atender. Estoy seguro de que te podré ayudar durante todo tu proceso.'],
  'Sebastián Lopez': ['SL', 'Sebastián Lopez', 'Abogado y Asesor Comercial', 'Sebas disponible para resolver cada duda del proceso. Es un honor acompañarte en esto.'],
};

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

function isDone(f) {
  const v = fd[f];
  if (f === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
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
      if (!first) first = el;
      ok = false;
    } else {
      el.classList.remove('bad');
    }
  });
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return ok;
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

  const a = fd.asesor;
  if (a && ASESORES[a]) {
    const [initials, name, role, msg] = ASESORES[a];
    const av = document.getElementById('a-avatar');
    av.className = 'asesor-avatar initials';
    av.textContent = initials;
    document.getElementById('a-name').textContent = name;
    document.getElementById('a-role').textContent = role;
    document.getElementById('a-quote').textContent = msg;
    document.getElementById('a-sig').innerHTML = '— <span>' + name + '</span>, Ulpik';
    document.getElementById('asesor-block').style.display = 'flex';
  }

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.getElementById('cf-video').src = CF;
    })
  );
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

  const payload = { ...fd, ts: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  try {
    await saveSurvey(payload);
  } catch (err) {
    console.warn('[compra] save:', err);
  }
  showSplashThenSuccess();
}

function closeLightbox() {
  document.getElementById('lb').classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('load', () => {
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
        markD('s-' + sc.f, i);
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
  document.getElementById('btn-sub').addEventListener('click', submitForm);
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb').addEventListener('click', (e) => {
    if (e.target.id === 'lb') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});
