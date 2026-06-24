#!/usr/bin/env node
/**
 * Sync public/satisfaccion from Ulpik bundler HTML export.
 * Usage: node sync-from-bundler.mjs "/path/to/Ulpik - Encuesta de Satisfaccion.html"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../../../public/satisfaccion');
const PAGE_KEY = 'uploads/ulpik_standalone_src';
const ASSET_V = '20250624';

const INTEGRATION_HEADER = `const LOCAL_SK='ulpik_nps_local';
const SK_CLIENT='ulpik_nps_v6';
const TK_CLIENT='ulpik_titulo_v6';
const NOTIFY='legal5@ulpik.com';
const SCALES=['nps','claridad','velocidad','calidad','satisfaccion'];

async function saveSurvey(entry){
  try{
    const r=await fetch('/api/surveys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)});
    if(!r.ok)throw new Error('api');
    return;
  }catch(e){
    let arr=[];
    try{const raw=localStorage.getItem(LOCAL_SK);if(raw)arr=JSON.parse(raw);}catch(e2){}
    arr.push(entry);
    localStorage.setItem(LOCAL_SK,JSON.stringify(arr));
  }
}

function getTituloUrl(){
  try{return localStorage.getItem(TK_CLIENT)||'';}catch(e){return'';}
}
`;

const SEND_NOTIF = `function sendNotif(e,tUrl){
  const critico=e.nps<=6||e.velocidad<=5||e.calidad<=5;
  const avg5=((e.nps+e.claridad+e.velocidad+e.calidad+e.satisfaccion)/5).toFixed(1);
  const tituloLink='https://ia.ulpik.com/titulo/?email='+encodeURIComponent(e.email||'');
  const txt=\`Nueva encuesta NPS — \${e.fecha_str} \${e.hora} | \${e.email} | Asesor: \${e.asesor} | Servicio: \${e.servicio}
Promedio: \${avg5}/10 | NPS:\${e.nps} Claridad:\${e.claridad} Velocidad:\${e.velocidad} Calidad:\${e.calidad} Satisfacción:\${e.satisfaccion}
Comentario: "\${e.comentario}"
\${critico?'⚠️ CRÍTICO — contacto en 24h':''}
Enviar título: \${tituloLink}
\${tUrl?'PDF título cliente: '+tUrl:'Sin PDF de título en storage'}\`;
  console.log('%c📧 NOTIFICACIÓN → '+NOTIFY,'color:#E8431A;font-weight:bold');
  console.log(txt);
}
`;

function extractPage(raw) {
  const m = raw.match(/<script type="__bundler\/template">\s*([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Missing __bundler/template');
  const td = JSON.parse(m[1]);
  const page = td.pages[PAGE_KEY];
  if (!page) throw new Error(`Missing page key: ${PAGE_KEY}`);
  return page;
}

function extractLogo(page) {
  const m = page.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error('Logo base64 not found');
  return Buffer.from(m[1], 'base64');
}

function buildCss(page) {
  let css = page.match(/<style>([\s\S]*?)<\/style>/)[1];
  css = css.replace(/@font-face\s*\{[^}]*\}/g, '');
  css = css.replace(/\/\*\s*(?:cyrillic-ext|cyrillic|greek-ext|greek|vietnamese|latin-ext|latin)\s*\*\/\s*/g, '');
  css = css.replace(/\.hero-watermark\{([^}]*)\}/, (m, inner) => {
    if (inner.includes('animation:')) return m;
    return `.hero-watermark{${inner};animation:wm-pulse 6s ease-in-out infinite}`;
  });
  return css.trim() + '\n';
}

function buildHtml(page) {
  let body = page.match(/<body>([\s\S]*?)<\/body>/)[1];
  body = body.replace(/<script>[\s\S]*?<\/script>/, '').trim();
  body = body.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, `logo.png?v=${ASSET_V}`);
  body = body.replace(/\n\s*\n/g, '\n');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ulpik · Califica tu experiencia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css?v=${ASSET_V}">
</head>
<body>
${body}
<script src="app.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function buildAppJs(page) {
  let js = page.match(/<script>([\s\S]*?)<\/script>/)[1].trim();
  js = js.replace(/^const SHEETS_URL=[^\n]+\n?/m, '');
  js = js.replace(/^const SK_CLIENT=[^\n]+\nconst TK_CLIENT=[^\n]+\nconst NOTIFY=[^\n]+\nconst SCALES=[^\n]+\n\n/m, '');
  js = js.replace(
    /\/\/ 1\. Guardar en storage compartido[\s\S]*?\/\/ 3\. Obtener título y notificar[\s\S]*?try\{await sendNotif\(entry,tituloUrl\);\}catch\(e\)\{console\.warn\('notif',e\);\}/,
    `try{await saveSurvey(entry);}catch(e){console.warn('storage',e);}
  const tituloUrl=getTituloUrl();
  sendNotif(entry,tituloUrl);`
  );
  js = js.replace(
    /async function sendNotif[\s\S]*$/,
    ''
  );
  js = js.replace(
    /function markDone\(stp\)\{[^}]+\}/,
    `$&
function resetStp(stp, num){
  if(!stp)return;
  stp.classList.remove('done','bad');
  const n=stp.querySelector('.stp-num');
  if(n&&num!=null)n.textContent=String(num);
}`
  );
  js = js.replace(
    /function onEmailInput\(\)\{[\s\S]*?updateProgress\(\);\s*\}/,
    `function onEmailInput(){
  const v=document.getElementById('f-email').value.trim();
  const ok=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v);
  const stp=document.getElementById('s-email');
  if(ok){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  else resetStp(stp,1);
  updateProgress();
}`
  );
  js = js.replace(
    /function onComentInput\(\)\{[\s\S]*?updateProgress\(\);\s*\}/,
    `function onComentInput(){
  const v=document.getElementById('f-comentario').value;
  document.getElementById('char-n').textContent=v.length;
  const stp=document.getElementById('s-comentario');
  if(v.trim().length>=5){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  else resetStp(stp,9);
  updateProgress();
}`
  );
  js = js.replace(
    /async function submitForm\(\)\{\s*let valid=true;/,
    `async function submitForm(){
  let valid=true;
  document.querySelectorAll('.stp.bad').forEach(s=>s.classList.remove('bad'));`
  );
  js = js.replace(
    /btn\.disabled=true;spin\.style\.display='block';btnTxt\.textContent='Enviando\.\.\.';/,
    `btn.disabled=true;
  btn.classList.add('loading');
  spin.style.display='block';
  btnTxt.textContent='Enviando...';`
  );
  js = js.replace(
    /document\.getElementById\('prog-wrap'\)\.style\.display='none';/,
    `document.getElementById('prog-wrap').style.display='none';
  document.querySelector('.foot')?.style.setProperty('display','none');`
  );
  js = js.replace(
    /btn\.disabled=false;[\s\S]*?btnTxt\.textContent='Enviar mi calificación →';/,
    `btn.disabled=false;
  btn.classList.remove('loading');
  spin.style.display='none';
  btnTxt.textContent='Enviar mi calificación →';
  window.scrollTo({top:0,behavior:'smooth'});`
  );
  return INTEGRATION_HEADER + '\n' + js.trim() + '\n\n' + SEND_NOTIF;
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node sync-from-bundler.mjs <bundler.html>');
    process.exit(1);
  }
  const raw = fs.readFileSync(path.resolve(input), 'utf8');
  const page = extractPage(raw);
  const logo = extractLogo(page);
  const indexHtml = buildHtml(page);
  const stylesCss = buildCss(page);
  const appJs = buildAppJs(page);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(OUT, 'styles.css'), stylesCss);
  fs.writeFileSync(path.join(OUT, 'app.js'), appJs);
  fs.writeFileSync(path.join(OUT, 'logo.png'), logo);

  const checks = ['window.storage', 'SHEETS_URL', 'anthropic', 'dashboard'];
  const bad = checks.filter((k) => appJs.includes(k) || indexHtml.includes(k));
  if (bad.length) console.warn('WARN: still contains:', bad.join(', '));
  else console.log('OK: no forbidden refs in output');

  console.log('Wrote:', OUT);
  console.log('  index.html', indexHtml.length, 'bytes');
  console.log('  styles.css', stylesCss.length, 'bytes');
  console.log('  app.js', appJs.length, 'bytes');
  console.log('  logo.png', logo.length, 'bytes');
}

main();
