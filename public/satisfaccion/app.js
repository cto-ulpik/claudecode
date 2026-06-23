/* ═════ LOGO ═════ */
const LOGO="data:image/svg+xml,"+encodeURIComponent(`<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 40\"><rect width=\"120\" height=\"40\" fill=\"transparent\"/><text x=\"60\" y=\"28\" text-anchor=\"middle\" font-family=\"Inter,Arial,sans-serif\" font-size=\"22\" font-weight=\"700\" fill=\"#E8431A\">ULPIK</text></svg>`);
['nav-logo','hero-logo','tw-logo'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=LOGO;});

/* ═════ CONFIG ═════ */
const SK='ulpik_nps_v6';
const TK='ulpik_titulo_v6';
const NOTIFY='legal5@ulpik.com';
const SCALES=['nps','claridad','velocidad','calidad','satisfaccion'];
let histCache=null;
async function loadHist(){
  if(histCache)return histCache;
  try{const r=await fetch('hist.json');if(r.ok)histCache=await r.json();else histCache=[];}catch(e){console.warn('hist',e);histCache=[];}
  return histCache;
}
const LOCAL_SK='ulpik_nps_local';
async function fetchSurveys(){
  try{const r=await fetch('/api/surveys');if(!r.ok)throw new Error('api');return await r.json();}catch(e){
    try{const raw=localStorage.getItem(LOCAL_SK);return raw?JSON.parse(raw):[];}catch(e2){return[];}
  }
}
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
  try{return localStorage.getItem(TK)||'';}catch(e){return'';}
}


/* ═════ FORM STATE ═════ */
const sel={asesor:null,servicio:null};
const scv={nps:null,claridad:null,velocidad:null,calidad:null,satisfaccion:null};
let charts={};
let curTab='overview';
let autoRefreshTimer=null;
let horaChip='am';// default
let pdfDataUrl='';// base64 pdf if uploaded

const SMSG={1:'😞 Muy malo',2:'😟 Malo',3:'😕 Por debajo de lo esperado',4:'😐 Regular',5:'🤔 Podría mejorar',6:'🙂 Aceptable',7:'😊 Bien',8:'😄 Muy bien',9:'🌟 Excelente',10:'🏆 ¡Superó todas las expectativas!'};

/* ═════ NAV ═════ */
function switchTab(tab){
  ['form','admin','titulo'].forEach(t=>{
    document.getElementById('pg-'+t).classList.toggle('show',t===tab);
    document.getElementById('tab-'+t).classList.toggle('on',t===tab);
  });
  if(tab==='admin'){loadDash();startAutoRefresh();}
  if(tab==='titulo') buildMsg();
}

/* ═════ INIT ═════ */
window.addEventListener('load',async()=>{
  await loadHist();
  buildScales();
  buildOpts();
  // auto detect hora chip
  const h=new Date().getHours();
  if(h>=12&&h<18) setChip('pm');
  else if(h>=18) setChip('night');
  else setChip('am');
});

/* ═════ OPTS ═════ */
function buildOpts(){
  document.querySelectorAll('.opt[data-group]').forEach(opt=>{
    opt.addEventListener('click',()=>selectOpt(opt));
    opt.setAttribute('tabindex','0');
    opt.setAttribute('role','radio');
    opt.setAttribute('aria-checked','false');
    opt.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();selectOpt(opt);}});
  });
}
function selectOpt(opt){
  const group=opt.dataset.group,val=opt.dataset.val;
  document.querySelectorAll('.opt[data-group="'+group+'"]').forEach(o=>{o.classList.remove('sel');o.setAttribute('aria-checked','false');});
  opt.classList.add('sel');opt.setAttribute('aria-checked','true');
  sel[group]=val;
  const stp=opt.closest('.stp');
  if(stp){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  updateProgress();
}

/* ═════ SCALES ═════ */
function buildScales(){
  SCALES.forEach(id=>{
    const wrap=document.getElementById('sc-'+id);
    if(!wrap)return;
    for(let i=1;i<=10;i++){
      const b=document.createElement('button');
      b.type='button';b.className='sbtn';b.textContent=String(i);
      (function(val,scaleId,wrapper,btn){
        btn.addEventListener('click',function(e){
          e.preventDefault();e.stopPropagation();
          scv[scaleId]=val;
          wrapper.querySelectorAll('.sbtn').forEach((x,j)=>x.classList.toggle('sel',j+1===val));
          const stp=document.getElementById('s-'+scaleId);
          stp.classList.remove('bad');stp.classList.add('done');markDone(stp);
          const sm=document.getElementById('sm-'+scaleId);
          sm.textContent=SMSG[val]||val+'/10';sm.className='score-msg set';
          updateProgress();
        });
      })(i,id,wrap,b);
      wrap.appendChild(b);
    }
  });
}
function markDone(stp){const n=stp.querySelector('.stp-num');if(n&&stp.classList.contains('done'))n.textContent='✓';}

/* ═════ INPUTS ═════ */
function onEmailInput(){
  const v=document.getElementById('f-email').value.trim();
  const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const stp=document.getElementById('s-email');
  if(ok){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  updateProgress();
}
function onComentInput(){
  const v=document.getElementById('f-comentario').value;
  document.getElementById('char-n').textContent=v.length;
  const stp=document.getElementById('s-comentario');
  if(v.trim().length>=5){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  updateProgress();
}
function updateProgress(){
  let done=0;
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('f-email').value.trim()))done++;
  if(sel.asesor)done++;
  SCALES.forEach(f=>{if(scv[f])done++;});
  if(document.getElementById('f-comentario').value.trim().length>=5)done++;
  const total=8;
  const pct=Math.min(Math.round(done/total*100),100);
  document.getElementById('prog-fill').style.width=pct+'%';
  document.getElementById('prog-pct').textContent=pct+'%';
  document.getElementById('prog-lbl').textContent=done+' de '+total+' completadas';
}

/* ═════ TOAST ═════ */
function showToast(msg,t='ok'){
  const el=document.getElementById('toast');
  el.textContent=(t==='ok'?'✓  ':t==='er'?'✗  ':'ℹ  ')+msg;
  el.className='toast show '+t;
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),5000);
}

/* ═════ SUBMIT ═════ */
async function submitForm(){
  let valid=true;
  const email=document.getElementById('f-email').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){document.getElementById('s-email').classList.add('bad');valid=false;}
  if(!sel.asesor){document.getElementById('s-asesor').classList.add('bad');valid=false;}
  SCALES.forEach(f=>{if(!scv[f]){document.getElementById('s-'+f).classList.add('bad');valid=false;}});
  const com=document.getElementById('f-comentario').value.trim();
  if(com.length<5){document.getElementById('s-comentario').classList.add('bad');valid=false;}
  if(!valid){
    showToast('Completa todos los campos marcados con *','er');
    setTimeout(()=>document.querySelector('.stp.bad')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
    return;
  }
  const btn=document.getElementById('btn-sub'),spin=document.getElementById('spin'),btnTxt=document.getElementById('btn-txt');
  btn.disabled=true;spin.style.display='block';btnTxt.textContent='Enviando...';
  const now=new Date();
  const mes=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const entry={
    fecha_str:now.toISOString().slice(0,10),
    hora:now.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}),
    mes,email,asesor:sel.asesor,
    servicio:sel.servicio||'No especificado',
    nps:scv.nps,claridad:scv.claridad,velocidad:scv.velocidad,
    calidad:scv.calidad,satisfaccion:scv.satisfaccion,
    comentario:com,
    instagram:document.getElementById('f-instagram').value.trim(),
    ts:Date.now()
  };
  try{await saveSurvey(entry);}catch(e){console.warn('storage',e);}
  const tituloUrl=getTituloUrl();
  try{await sendNotif(entry,tituloUrl);}catch(e){console.warn('notif',e);}
  document.getElementById('survey-form').style.display='none';
  document.getElementById('prog-wrap').style.display='none';
  document.getElementById('succ').classList.add('show');
  if(tituloUrl){const dl=document.getElementById('dl-btn');dl.href=tituloUrl;dl.style.display='inline-flex';}
  btn.disabled=false;spin.style.display='none';btnTxt.textContent='Enviar mi calificación →';
}

async function sendNotif(e,tUrl){
  const critico=e.nps<=6||e.velocidad<=5||e.calidad<=5;
  const avg5=((e.nps+e.claridad+e.velocidad+e.calidad+e.satisfaccion)/5).toFixed(1);
  const txt=`Nueva encuesta NPS — ${e.fecha_str} ${e.hora} | ${e.email} | Asesor: ${e.asesor} | Servicio: ${e.servicio}
Promedio: ${avg5}/10 | NPS:${e.nps} Claridad:${e.claridad} Velocidad:${e.velocidad} Calidad:${e.calidad} Satisfacción:${e.satisfaccion}
Comentario: \"${e.comentario}\"
${critico?'⚠️ CRÍTICO — contacto en 24h':''}
${tUrl?'Título: '+tUrl:'Sin título configurado'}`;
  console.log('%c📧 NOTIFICACIÓN → '+NOTIFY,'color:#22C97A;font-weight:bold');
  console.log(txt);
}

/* ═════ ADMIN ═════ */
function chkSession(){loadDash();startAutoRefresh();}
function doLogin(){}
function startAutoRefresh(){
  clearInterval(autoRefreshTimer);
  autoRefreshTimer=setInterval(()=>{
    if(document.getElementById('pg-admin').classList.contains('show'))loadDash(true);
  },30000);
}

/* ═════ TITULO PAGE ═════ */
function chkTSession(){buildMsg();}
function doTLogin(){}

/* ═════ HORA CHIPS ═════ */
function setChip(tipo){
  horaChip=tipo;
  ['am','pm','night'].forEach(c=>{
    document.getElementById('chip-'+c).classList.toggle('on',c===tipo);
  });
  buildMsg();
}

/* ═════ PDF UPLOAD ═════ */
function onPdfChange(input){
  const file=input.files[0];
  if(!file)return;
  if(file.size>20*1024*1024){showToast('El PDF supera los 20 MB','er');return;}
  const reader=new FileReader();
  reader.onload=function(e){
    pdfDataUrl=e.target.result;
    document.getElementById('pdf-title').textContent='PDF seleccionado';
    document.getElementById('pdf-sub').textContent=file.name+' · '+Math.round(file.size/1024)+' KB';
    document.getElementById('pdf-name').textContent='✓ '+file.name;
    document.getElementById('pdf-name').style.display='block';
    document.getElementById('pdf-drop').classList.add('has-file');
    buildMsg();
  };
  reader.readAsDataURL(file);
}

/* ═════ BUILD MESSAGE ═════ */
function buildMsg(){
  const nombre=(document.getElementById('t-nombre')?.value||'').trim();
  const marca=(document.getElementById('t-marca')?.value||'').trim();
  const link=(document.getElementById('t-link')?.value||'').trim();

  const saludos={
    am:'Buenos días',
    pm:'Buenas tardes',
    night:'Buenas noches'
  };
  const saludo=saludos[horaChip]||'Buenos días';

  const nombreMostrar=nombre||'[Nombre del cliente]';
  const marcaMostrar=marca||'[Nombre de la marca]';

  let enlaceLinea='';
  if(link&&link.startsWith('http')){
    enlaceLinea='\n\n🔗 Aquí tienes el acceso a tu título oficial:\n'+link;
  }else if(pdfDataUrl){
    enlaceLinea='\n\n📎 Te adjunto el título oficial en PDF.';
  }else{
    enlaceLinea='\n\n📎 [Adjunta el PDF del título aquí]';
  }

  const msg=`Hola ${nombreMostrar} ${saludo}, excelente jornada, viene cargada de buenas noticias 🥳

La espera POR FIN terminó, nos acaba de llegar el título oficial de tu marca *${marcaMostrar}*, ahora sí hemos culminado satisfactoriamente el trámite. ¡Qué felicidad haberte podido servir durante este tiempo! Tu marca se encuentra protegida durante *10 años* y todo ha salido satisfactoriamente. Un abrazo grande y gracias por confiar en nosotros 🥳👏👏

Qué alegría haberte podido ayudar durante todo este tiempo, y qué mejor que haber confiado en nosotros. Estamos para servirte y ahora sí, con toda la emoción, *oficialmente tu marca está protegida*. No lo cargues hasta que estés el 95% seguro. Igualmente recuerda que el título tiene toda la validez legal como documento oficial de protección de tu marca.${enlaceLinea}

_Si necesitas algo más, aquí estamos. ¡Mucho éxito con tu emprendimiento!_ 🚀`;

  document.getElementById('msg-preview-text').textContent=msg;

  const hayDatos=nombre&&marca;
  const hayEnlace=link||pdfDataUrl;
  let status='';
  if(!nombre&&!marca) status='Completa el nombre del cliente y la marca';
  else if(!nombre) status='Falta el nombre del cliente';
  else if(!marca) status='Falta el nombre de la marca';
  else if(!hayEnlace) status='Listo — agrega el enlace o PDF del título';
  else status='✓ Mensaje listo para copiar';

  document.getElementById('msg-status').textContent=status;
  document.getElementById('msg-status').style.color=hayDatos&&hayEnlace?'var(--ok)':'var(--txt2)';
}

function copyMsgFull(){
  const txt=document.getElementById('msg-preview-text').textContent;
  if(!txt||txt.includes('Completa los datos'))return showToast('Primero completa los datos del cliente','er');
  navigator.clipboard.writeText(txt).then(()=>{
    const btn=document.getElementById('btn-copy-msg');
    const ctxt=document.getElementById('copy-txt');
    btn.classList.add('copied');ctxt.textContent='✓ ¡Copiado!';
    setTimeout(()=>{btn.classList.remove('copied');ctxt.textContent='Copiar mensaje completo';},3000);
    showToast('Mensaje copiado — pégalo en Bitrix');
  }).catch(()=>{
    // fallback
    const ta=document.createElement('textarea');
    ta.value=txt;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');showToast('Mensaje copiado');}catch(e){showToast('No se pudo copiar automáticamente','er');}
    document.body.removeChild(ta);
  });
}

async function loadAll(){const hist=await loadHist();const news=await fetchSurveys();return[...hist,...news];}
function avg(a){return a.length?+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(1):0;}
function npsScore(a){if(!a.length)return 0;const p=a.filter(v=>v>=9).length,d=a.filter(v=>v<=6).length;return Math.round((p-d)/a.length*100);}
function dc(id){if(charts[id]){charts[id].destroy();delete charts[id];}}
function col(v){return +v>=8?'#22C97A':+v>=6?'#FF6B3D':'#FF4444';}
const ML=['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];
const MN={'2026-01':'Ene','2026-02':'Feb','2026-03':'Mar','2026-04':'Abr','2026-05':'May','2026-06':'Jun'};
const ACC='#E8431A',OK='#22C97A',ERR='#FF4444',ACC2='#FF6B3D';
const CO={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1a1a',padding:10,cornerRadius:8,borderColor:'rgba(255,255,255,.1)',borderWidth:1}}};

async function refrDash(){await loadDash();showToast('Dashboard actualizado');}
async function loadDash(silent=false){
  const data=await loadAll();
  buildKpis(data);
  renderTab(curTab,data);
}
function buildKpis(d){
  const n=npsScore(d.map(r=>r.nps));
  const pr=d.filter(r=>r.nps>=9).length;
  const pa=d.filter(r=>r.nps>=7&&r.nps<=8).length;
  const det=d.filter(r=>r.nps<=6).length;
  const vel=avg(d.map(r=>r.velocidad));
  const sat=avg(d.map(r=>r.satisfaccion));
  const cal=avg(d.map(r=>r.calidad));
  const cla=avg(d.map(r=>r.claridad));
  const total=d.length;
  const trend=calcTrend(d);

  document.getElementById('d-kpis').innerHTML=`
    <div class="kpi green">
      <div class="klab">NPS Global</div>
      <div class="kval" style="color:${n>=60?OK:n>=30?ACC2:ERR}">${n}</div>
      <div class="ksub">${n>=60?'🟢 Excelente':n>=30?'🟡 Bueno':'🔴 Requiere atención'}</div>
    </div>
    <div class="kpi">
      <div class="klab">Respuestas totales</div>
      <div class="kval">${total}</div>
      <div class="ksub">${pr} promotores · ${pa} pasivos · ${det} detractores</div>
    </div>
    <div class="kpi">
      <div class="klab">Satisfacción final</div>
      <div class="kval" style="color:${col(sat)}">${sat}</div>
      <div class="ksub">/ 10 · ${trend.sat>0?'↑ sube':'↓ baja'} vs mes anterior</div>
    </div>
    <div class="kpi ${+vel<7.5?'red':''}">
      <div class="klab">Velocidad</div>
      <div class="kval" style="color:${col(vel)}">${vel}</div>
      <div class="ksub">/ 10 · métrica más crítica</div>
    </div>
    <div class="kpi">
      <div class="klab">Calidad atención</div>
      <div class="kval" style="color:${col(cal)}">${cal}</div>
      <div class="ksub">/ 10 promedio</div>
    </div>
    <div class="kpi">
      <div class="klab">Claridad proceso</div>
      <div class="kval" style="color:${col(cla)}">${cla}</div>
      <div class="ksub">/ 10 promedio</div>
    </div>`;
}

function calcTrend(data){
  const meses=ML.filter(m=>data.some(r=>r.mes===m));
  if(meses.length<2)return{sat:0,nps:0,vel:0};
  const last=data.filter(r=>r.mes===meses[meses.length-1]);
  const prev=data.filter(r=>r.mes===meses[meses.length-2]);
  return{
    sat:+(avg(last.map(r=>r.satisfaccion))-avg(prev.map(r=>r.satisfaccion))).toFixed(1),
    nps:npsScore(last.map(r=>r.nps))-npsScore(prev.map(r=>r.nps)),
    vel:+(avg(last.map(r=>r.velocidad))-avg(prev.map(r=>r.velocidad))).toFixed(1)
  };
}

function goDtab(tab,btn){
  curTab=tab;
  document.querySelectorAll('.dtab').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  ['overview','preguntas','asesores','meses','comentarios'].forEach(t=>{
    const el=document.getElementById('dt-'+t);
    if(el)el.style.display=t===tab?'block':'none';
  });
  loadAll().then(d=>renderTab(tab,d));
}
function renderTab(tab,data){({overview:rOv,preguntas:rPreguntas,asesores:rAs,meses:rMs,comentarios:rCo})[tab]?.(data);}

/* ── MEJORAS ── */
function buildMejoras(data){
  const comments=data.map(r=>r.comentario||'').filter(c=>c.trim().length>5);
  const pats=[
    {k:/seguimiento|actualiz|estado|notific|avisar|mensaj/i,t:'Seguimiento proactivo',d:'Actualizaciones periódicas sin que el cliente pregunte.'},
    {k:/veloc|lento|rápid|demor|tiempo|tardaron|esperar/i,t:'Velocidad del proceso',d:'Los tiempos reales no coinciden con las expectativas iniciales.'},
    {k:/asesor|cambio|continuidad|personal/i,t:'Continuidad del asesor',d:'El cambio de asesor a mitad del trámite afecta la confianza.'},
    {k:/zoom|llamada|presencial|confianza|video/i,t:'Videollamada de bienvenida',d:'Una llamada inicial genera confianza antes de arrancar.'},
    {k:/ruc|sri|tributario|impuesto|obligacion/i,t:'Guía de obligaciones posteriores',d:'Clientes no saben qué viene después de registrar su marca.'},
  ];
  const hits=pats.map(p=>({...p,n:comments.filter(c=>p.k.test(c)).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
  return hits.length?hits.slice(0,5):pats.slice(0,3);
}

/* ══════════════════════════════════════════════
   OVERVIEW — Resumen ejecutivo
══════════════════════════════════════════════ */
function rOv(data){
  const el=document.getElementById('dt-overview');
  const mej=buildMejoras(data);
  const trend=calcTrend(data);

  const md=ML.filter(m=>data.some(r=>r.mes===m)).map(m=>{
    const d=data.filter(r=>r.mes===m);
    return{m,n:d.length,pr:d.filter(r=>r.nps>=9).length,pa:d.filter(r=>r.nps>=7&&r.nps<=8).length,de:d.filter(r=>r.nps<=6).length,np:npsScore(d.map(r=>r.nps))};
  });

  const sv=['Registro de marca','SAS','Otro'].map(s=>{
    const d=data.filter(r=>r.servicio===s);
    return{s,n:d.length,np:d.length?npsScore(d.map(r=>r.nps)):0,sat:avg(d.map(r=>r.satisfaccion))};
  }).filter(x=>x.n>0);
  const mx=Math.max(...sv.map(x=>x.n),1);

  // Tendencia KPIs
  const trendHtml=(v,label)=>`<span style="font-size:11px;font-weight:700;color:${v>0?OK:v<0?ERR:'var(--txt2)'};">${v>0?'▲':'▼'} ${Math.abs(v)} ${label} vs mes ant.</span>`;

  el.innerHTML=`
  <!-- TENDENCIAS RÁPIDAS -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:20px">
    <div style="background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
      <div style="font-size:28px">📈</div>
      <div><div style="font-size:11px;color:var(--txt2);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Tendencia NPS</div><div style="font-size:15px;font-weight:700;margin-top:3px;color:${trend.nps>=0?OK:ERR}">${trend.nps>=0?'▲':'▼'} ${Math.abs(trend.nps)} pts</div></div>
    </div>
    <div style="background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
      <div style="font-size:28px">⚡</div>
      <div><div style="font-size:11px;color:var(--txt2);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Tendencia velocidad</div><div style="font-size:15px;font-weight:700;margin-top:3px;color:${trend.vel>=0?OK:ERR}">${trend.vel>=0?'▲':'▼'} ${Math.abs(trend.vel)} pts</div></div>
    </div>
    <div style="background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">
      <div style="font-size:28px">⭐</div>
      <div><div style="font-size:11px;color:var(--txt2);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Tendencia satisfacción</div><div style="font-size:15px;font-weight:700;margin-top:3px;color:${trend.sat>=0?OK:ERR}">${trend.sat>=0?'▲':'▼'} ${Math.abs(trend.sat)} pts</div></div>
    </div>
  </div>

  <!-- GRÁFICOS PRINCIPALES -->
  <div class="g2">
    <div class="card"><h3>NPS mensual</h3><div class="csub">Evolución 2026 — línea verde = meta 60</div><div style="height:220px;position:relative"><canvas id="c_np"></canvas></div></div>
    <div class="card"><h3>Distribución de respuestas</h3><div class="csub">Promotores · Pasivos · Detractores</div><div style="height:220px;position:relative"><canvas id="c_di"></canvas></div></div>
  </div>

  <div class="g2">
    <div class="card"><h3>Radar de experiencia</h3><div class="csub">Promedio global de las 5 métricas / 10</div><div style="height:240px;position:relative"><canvas id="c_radar"></canvas></div></div>
    <div class="card"><h3>Composición del NPS</h3><div class="csub">Proporción promotores / pasivos / detractores</div><div style="height:240px;position:relative;display:flex;align-items:center;justify-content:center"><canvas id="c_donut"></canvas></div></div>
  </div>

  <!-- SERVICIOS -->
  <div class="card"><h3>Resultados por tipo de servicio</h3><div class="csub">Volumen de respuestas, NPS y satisfacción promedio</div>
    ${sv.map(x=>`
    <div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--ln)">
      <div style="width:140px;font-size:13px;font-weight:600">${x.s}</div>
      <div style="flex:1;height:6px;background:rgba(255,255,255,.07);border-radius:3px"><div style="height:100%;width:${x.n/mx*100}%;background:${ACC};border-radius:3px;transition:width .8s ease"></div></div>
      <span style="font-size:12px;color:var(--txt2);min-width:64px">${x.n} resp.</span>
      <span class="tag ${x.np>=60?'g':x.np>=30?'o':'r'}">NPS ${x.np}</span>
      <span style="font-size:12px;font-weight:700;min-width:46px;color:${col(x.sat)}">${x.sat}/10</span>
    </div>`).join('')}
  </div>

  <!-- PUNTOS DE MEJORA -->
  <div class="mejbox">
    <h3>⚡ Puntos de mejora prioritarios</h3>
    <div class="msub">Análisis automático de ${data.filter(r=>r.comentario&&r.comentario.length>5).length} comentarios recibidos</div>
    ${mej.map((m,i)=>`<div class="mej-item"><div class="mej-n">${i+1}</div><div class="mej-txt"><h5>${m.t} <span style="font-size:11px;font-weight:600;color:var(--txt2);margin-left:6px">${m.n} mención${m.n>1?'es':''}</span></h5><p>${m.d}</p></div></div>`).join('')}
  </div>`;

  setTimeout(()=>{
    dc('c_np');dc('c_di');dc('c_radar');dc('c_donut');
    const total=data.length;
    const pr=data.filter(r=>r.nps>=9).length;
    const pa=data.filter(r=>r.nps>=7&&r.nps<=8).length;
    const det=data.filter(r=>r.nps<=6).length;

    // NPS line
    charts['c_np']=new Chart(document.getElementById('c_np'),{type:'line',data:{labels:md.map(d=>MN[d.m]||d.m),datasets:[
      {data:md.map(d=>d.np),borderColor:ACC,backgroundColor:'rgba(232,67,26,.07)',fill:true,tension:.4,borderWidth:2.5,pointRadius:5,pointBackgroundColor:ACC,pointBorderColor:'#080808',pointBorderWidth:2,label:'NPS'},
      {data:md.map(()=>60),borderColor:'rgba(34,201,122,.35)',borderWidth:1.5,borderDash:[5,4],pointRadius:0,fill:false,label:'Meta'}
    ]},options:{...CO,plugins:{...CO.plugins,legend:{display:true,labels:{color:'rgba(255,255,255,.5)',usePointStyle:true,pointStyle:'circle',font:{size:11},padding:10}}},scales:{x:{grid:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}}}}});

    // Stacked bar
    charts['c_di']=new Chart(document.getElementById('c_di'),{type:'bar',data:{labels:md.map(d=>MN[d.m]||d.m),datasets:[
      {label:'Promotores',data:md.map(d=>d.pr),backgroundColor:OK,borderRadius:4,stack:'s'},
      {label:'Pasivos',data:md.map(d=>d.pa),backgroundColor:ACC,borderRadius:4,stack:'s'},
      {label:'Detractores',data:md.map(d=>d.de),backgroundColor:ERR,borderRadius:4,stack:'s'}
    ]},options:{...CO,plugins:{...CO.plugins,legend:{display:true,labels:{color:'rgba(255,255,255,.5)',usePointStyle:true,pointStyle:'circle',font:{size:11},padding:10}}},scales:{x:{stacked:true,grid:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{stacked:true,grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}}}}});

    // Radar
    charts['c_radar']=new Chart(document.getElementById('c_radar'),{type:'radar',data:{
      labels:['NPS','Claridad','Velocidad','Calidad','Satisfacción'],
      datasets:[{
        data:[avg(data.map(r=>r.nps)),avg(data.map(r=>r.claridad)),avg(data.map(r=>r.velocidad)),avg(data.map(r=>r.calidad)),avg(data.map(r=>r.satisfaccion))],
        backgroundColor:'rgba(232,67,26,.15)',borderColor:ACC,borderWidth:2,pointBackgroundColor:ACC,pointRadius:4,pointBorderColor:'#080808',pointBorderWidth:2
      }]
    },options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:10,grid:{color:'rgba(255,255,255,.08)'},angleLines:{color:'rgba(255,255,255,.08)'},pointLabels:{color:'rgba(255,255,255,.65)',font:{size:12,weight:'600'}},ticks:{display:false}}},plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1a1a',padding:10,cornerRadius:8}}}});

    // Donut NPS
    charts['c_donut']=new Chart(document.getElementById('c_donut'),{type:'doughnut',data:{
      labels:['Promotores','Pasivos','Detractores'],
      datasets:[{data:[pr,pa,det],backgroundColor:[OK,ACC,ERR],borderWidth:0,hoverOffset:6}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:'rgba(255,255,255,.55)',usePointStyle:true,pointStyle:'circle',font:{size:12},padding:14}},tooltip:{backgroundColor:'#1a1a1a',padding:10,cornerRadius:8,callbacks:{label:c=>`${c.label}: ${c.parsed} (${Math.round(c.parsed/total*100)}%)`}}}}});
  },60);
}

/* ══════════════════════════════════════════════
   PREGUNTAS — Promedio por pregunta
══════════════════════════════════════════════ */
function rPreguntas(data){
  const el=document.getElementById('dt-preguntas');

  const dims=[
    {k:'nps',label:'NPS — Recomendación',desc:'¿Qué tan probable es que recomiende Ulpik?',icon:'📣'},
    {k:'claridad',label:'Claridad del proceso',desc:'¿Qué tan claro quedó el paso a paso?',icon:'📋'},
    {k:'velocidad',label:'Velocidad del servicio',desc:'¿Qué tan rápido fue el servicio?',icon:'⚡'},
    {k:'calidad',label:'Calidad de atención',desc:'¿Cómo fue la calidad del asesor?',icon:'🎯'},
    {k:'satisfaccion',label:'Satisfacción final',desc:'¿Qué tan satisfecho quedó con el resultado?',icon:'⭐'},
  ];

  // Distribution per dim (1-10 counts)
  const distrib=dims.map(d=>{
    const vals=data.map(r=>r[d.k]).filter(v=>v);
    const counts=Array(10).fill(0);
    vals.forEach(v=>counts[v-1]++);
    return{...d,avg:avg(vals),counts,n:vals.length};
  });

  el.innerHTML=`
  <!-- RESUMEN RADAR + BARRAS HORIZONTALES -->
  <div class="g2">
    <div class="card"><h3>Promedio global por pregunta</h3><div class="csub">Radar comparativo de las 5 métricas — escala 0 a 10</div><div style="height:260px;position:relative"><canvas id="c_pq_radar"></canvas></div></div>
    <div class="card"><h3>Ranking de preguntas</h3><div class="csub">De mayor a menor promedio — ${data.length} respuestas</div>
      <div style="padding-top:8px">
      ${[...distrib].sort((a,b)=>b.avg-a.avg).map(d=>`
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600">${d.icon} ${d.label}</span>
          <span style="font-size:15px;font-weight:700;color:${col(d.avg)}">${d.avg}</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,.07);border-radius:4px">
          <div style="height:100%;width:${d.avg*10}%;background:${col(d.avg)};border-radius:4px;transition:width .8s ease"></div>
        </div>
        <div style="font-size:11px;color:var(--txt2);margin-top:4px">${d.desc}</div>
      </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- DETALLE POR PREGUNTA -->
  <div class="card"><h3>Distribución de respuestas por pregunta</h3><div class="csub">Cantidad de respuestas en cada puntuación del 1 al 10</div>
    <div style="height:320px;position:relative"><canvas id="c_pq_dist"></canvas></div>
  </div>

  <!-- CARDS INDIVIDUALES POR PREGUNTA -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px">
  ${distrib.map(d=>{
    const prom=d.avg;
    const pct10=Math.round(d.counts[9]/d.n*100)||0;
    const pct_low=Math.round((d.counts[0]+d.counts[1]+d.counts[2]+d.counts[3])/d.n*100)||0;
    return `<div style="background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:18px">
      <div style="font-size:22px;margin-bottom:8px">${d.icon}</div>
      <div style="font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${d.label}</div>
      <div style="font-size:36px;font-weight:700;letter-spacing:-.03em;color:${col(prom)};line-height:1">${prom}</div>
      <div style="font-size:11px;color:var(--txt2);margin-bottom:10px">/ 10 promedio · ${d.n} resp.</div>
      <div style="display:flex;gap:8px;font-size:11px;flex-wrap:wrap">
        <span style="background:rgba(34,201,122,.1);color:var(--ok);padding:3px 8px;border-radius:6px;font-weight:600">${pct10}% dieron 10</span>
        ${pct_low>0?`<span style="background:rgba(255,68,68,.1);color:var(--err);padding:3px 8px;border-radius:6px;font-weight:600">${pct_low}% bajo 5</span>`:''}
      </div>
    </div>`;
  }).join('')}
  </div>`;

  setTimeout(()=>{
    dc('c_pq_radar'); dc('c_pq_dist');

    charts['c_pq_radar']=new Chart(document.getElementById('c_pq_radar'),{type:'radar',data:{
      labels:distrib.map(d=>d.label.split(' ').slice(0,2).join(' ')),
      datasets:[{
        data:distrib.map(d=>d.avg),
        backgroundColor:'rgba(232,67,26,.15)',borderColor:ACC,borderWidth:2.5,
        pointBackgroundColor:distrib.map(d=>col(d.avg)),pointRadius:5,pointBorderColor:'#080808',pointBorderWidth:2
      }]
    },options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:10,grid:{color:'rgba(255,255,255,.08)'},angleLines:{color:'rgba(255,255,255,.08)'},pointLabels:{color:'rgba(255,255,255,.65)',font:{size:11,weight:'600'}},ticks:{display:false}}},plugins:{legend:{display:false}}}});

    charts['c_pq_dist']=new Chart(document.getElementById('c_pq_dist'),{type:'bar',data:{
      labels:['1','2','3','4','5','6','7','8','9','10'],
      datasets:distrib.map((d,i)=>({
        label:d.label,
        data:d.counts,
        backgroundColor:[OK+'cc',ACC2+'cc',ERR+'cc','#a78bfa'+'cc','#38bdf8'+'cc'][i],
        borderRadius:4
      }))
    },options:{...CO,scales:{x:{grid:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}}},plugins:{...CO.plugins,legend:{display:true,labels:{color:'rgba(255,255,255,.5)',usePointStyle:true,pointStyle:'circle',font:{size:11},padding:10}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y} respuestas`}}}}});
  },60);
}

/* ══════════════════════════════════════════════
   ASESORES — Métricas por asesor
══════════════════════════════════════════════ */
function rAs(data){
  const el=document.getElementById('dt-asesores');
  const ACTIVE=['Esteban Maldonado','Martín Coello','Sebastian López','Javier España','Marianela Espinoza'];
  const byA={};
  data.forEach(r=>{
    if(!byA[r.asesor])byA[r.asesor]={np:[],cl:[],ve:[],ca:[],sa:[],comments:[],fechas:[]};
    const d=byA[r.asesor];
    d.np.push(r.nps);d.cl.push(r.claridad);d.ve.push(r.velocidad);
    d.ca.push(r.calidad);d.sa.push(r.satisfaccion);
    if(r.comentario&&r.comentario.trim().length>4)d.comments.push(r.comentario);
    d.fechas.push(r.fecha_str);
  });
  const asesores=ACTIVE.filter(a=>byA[a]).map(a=>{
    const d=byA[a];
    return{n:a,c:d.np.length,np:npsScore(d.np),ve:avg(d.ve),ca:avg(d.ca),cl:avg(d.cl),sa:avg(d.sa),
      prom:avg([avg(d.np),avg(d.cl),avg(d.ve),avg(d.ca),avg(d.sa)]),
      comments:d.comments};
  });

  el.innerHTML=`
  <!-- GRÁFICO COMPARATIVA APILADA -->
  <div class="card"><h3>Comparativa multidimensional por asesor</h3><div class="csub">Claridad · Velocidad · Calidad · Satisfacción — activos 2026</div>
    <div style="height:${asesores.length*62+80}px;position:relative"><canvas id="c_ac"></canvas></div>
  </div>

  <!-- NPS POR ASESOR BAR HORIZONTAL -->
  <div class="g2">
    <div class="card"><h3>NPS por asesor</h3><div class="csub">Net Promoter Score individual</div>
      <div style="height:${asesores.length*52+60}px;position:relative"><canvas id="c_anps"></canvas></div>
    </div>
    <div class="card"><h3>Velocidad por asesor</h3><div class="csub">Métrica más crítica · rojo &lt; 7</div>
      <div style="height:${asesores.length*52+60}px;position:relative"><canvas id="c_avel"></canvas></div>
    </div>
  </div>

  <!-- CARDS INDIVIDUALES -->
  ${asesores.map(a=>`
  <div class="acard">
    <div class="acard-head">
      <div>
        <div style="font-size:14px;font-weight:700">${a.n}</div>
        <div style="font-size:11px;color:var(--txt2);margin-top:2px">${a.c} respuestas · Promedio general ${a.prom}/10</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="tag ${a.np>=60?'g':a.np>=30?'o':'r'}">NPS ${a.np}</span>
        <span style="font-size:13px;font-weight:700;color:${col(a.prom)}">${a.prom}/10</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      ${[['Claridad',a.cl,'📋'],['Velocidad',a.ve,'⚡'],['Calidad',a.ca,'🎯'],['Satisfacción',a.sa,'⭐']].map(([nm,v,ic])=>`
      <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px">
        <div style="font-size:11px;color:var(--txt2);margin-bottom:4px">${ic} ${nm}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:5px;background:rgba(255,255,255,.08);border-radius:3px"><div style="height:100%;width:${+v*10}%;background:${col(v)};border-radius:3px"></div></div>
          <span style="font-size:13px;font-weight:700;color:${col(v)}">${v}</span>
        </div>
      </div>`).join('')}
    </div>
    ${a.comments.length?`<details><summary style="font-size:12px;color:var(--txt2);cursor:pointer;padding:6px 0;list-style:none">▸ Ver ${a.comments.length} comentario${a.comments.length>1?'s':''}</summary><div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${a.comments.slice(0,5).map(c=>`<div style="font-size:12.5px;color:var(--txt2);padding:9px 12px;background:rgba(255,255,255,.04);border-radius:8px;line-height:1.55">"${c}"</div>`).join('')}</div></details>`:''}
  </div>`).join('')}`;

  setTimeout(()=>{
    dc('c_ac');dc('c_anps');dc('c_avel');

    charts['c_ac']=new Chart(document.getElementById('c_ac'),{type:'bar',data:{labels:asesores.map(a=>a.n),datasets:[
      {label:'Claridad',data:asesores.map(a=>a.cl),backgroundColor:OK+'99',borderRadius:4},
      {label:'Velocidad',data:asesores.map(a=>a.ve),backgroundColor:ERR+'99',borderRadius:4},
      {label:'Calidad',data:asesores.map(a=>a.ca),backgroundColor:ACC+'99',borderRadius:4},
      {label:'Satisfacción',data:asesores.map(a=>a.sa),backgroundColor:ACC2+'99',borderRadius:4}
    ]},options:{...CO,indexAxis:'y',plugins:{...CO.plugins,legend:{display:true,labels:{color:'rgba(255,255,255,.5)',usePointStyle:true,pointStyle:'circle',font:{size:11},padding:10}}},scales:{x:{min:0,max:10,grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{display:false},ticks:{color:'rgba(255,255,255,.8)',font:{weight:'600',size:12}}}}}});

    charts['c_anps']=new Chart(document.getElementById('c_anps'),{type:'bar',data:{labels:asesores.map(a=>a.n),datasets:[{data:asesores.map(a=>a.np),backgroundColor:asesores.map(a=>a.np>=60?OK:a.np>=30?ACC:ERR),borderRadius:5}]},options:{...CO,indexAxis:'y',scales:{x:{grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{display:false},ticks:{color:'rgba(255,255,255,.8)',font:{weight:'600',size:12}}}},plugins:{...CO.plugins,tooltip:{callbacks:{label:c=>'NPS: '+Math.round(c.parsed.x)}}}}});

    charts['c_avel']=new Chart(document.getElementById('c_avel'),{type:'bar',data:{labels:asesores.map(a=>a.n),datasets:[{data:asesores.map(a=>a.ve),backgroundColor:asesores.map(a=>col(a.ve)),borderRadius:5}]},options:{...CO,indexAxis:'y',scales:{x:{min:0,max:10,grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{display:false},ticks:{color:'rgba(255,255,255,.8)',font:{weight:'600',size:12}}}},plugins:{...CO.plugins,tooltip:{callbacks:{label:c=>c.parsed.x.toFixed(1)+'/10'}}}}});
  },60);
}

/* ══════════════════════════════════════════════
   MESES — Evolución mensual con selector
══════════════════════════════════════════════ */
function rMs(data){
  const el=document.getElementById('dt-meses');

  const allMeses=ML.filter(m=>data.some(r=>r.mes===m));
  // Include current month even if no data yet
  const nowMes=new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0');
  const displayMeses=[...new Set([...allMeses,nowMes])].sort();

  const md=displayMeses.map(m=>{
    const d=data.filter(r=>r.mes===m);
    return{m,n:d.length,np:d.length?npsScore(d.map(r=>r.nps)):null,
      cl:d.length?avg(d.map(r=>r.claridad)):null,
      ve:d.length?avg(d.map(r=>r.velocidad)):null,
      ca:d.length?avg(d.map(r=>r.calidad)):null,
      sa:d.length?avg(d.map(r=>r.satisfaccion)):null};
  });

  el.innerHTML=`
  <!-- SELECTOR DE MES -->
  <div style="background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:18px 20px;margin-bottom:18px">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
      <div><div style="font-size:15px;font-weight:700">Seleccionar mes</div><div style="font-size:12px;color:var(--txt2);margin-top:2px">Filtra el detalle por mes específico</div></div>
      <button onclick="clearMesFil()" style="background:rgba(255,255,255,.06);border:1px solid var(--ln);padding:6px 12px;border-radius:8px;color:var(--txt2);font-family:inherit;font-size:12px;cursor:pointer">Ver todos</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="mes-chips">
      ${displayMeses.map(m=>{
        const isCurrent=m===nowMes;
        const d=data.filter(r=>r.mes===m);
        return `<button class="mes-chip ${isCurrent?'current':''}" data-mes="${m}" onclick="filterMes('${m}',this)" style="border:1.5px solid ${isCurrent?'rgba(34,201,122,.4)':'var(--ln)'};background:${isCurrent?'rgba(34,201,122,.08)':'var(--inp)'};color:${isCurrent?'var(--ok)':'var(--txt2)'};padding:7px 14px;border-radius:20px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:.18s;white-space:nowrap">
          ${MN[m]||m} ${d.length>0?`(${d.length})`:'📍 Actual'}
        </button>`;
      }).join('')}
    </div>
  </div>

  <div id="mes-detail-container">
    <!-- detalle del mes seleccionado aparece aquí -->
  </div>

  <!-- GRÁFICOS GLOBALES -->
  <div class="card"><h3>Evolución mensual de métricas</h3><div class="csub">Las 4 dimensiones de experiencia — escala 0 a 10</div>
    <div style="height:280px;position:relative"><canvas id="c_mm"></canvas></div>
  </div>

  <div class="g2">
    <div class="card"><h3>Volumen de respuestas por mes</h3><div class="csub">Cantidad de encuestas completadas</div><div style="height:200px;position:relative"><canvas id="c_mvol"></canvas></div></div>
    <div class="card"><h3>NPS por mes</h3><div class="csub">Tendencia mensual del Net Promoter Score</div><div style="height:200px;position:relative"><canvas id="c_mnps2"></canvas></div></div>
  </div>

  <!-- TABLA -->
  <div class="card"><h3>Tabla resumen ejecutivo</h3><div class="csub">Todas las métricas por mes · color semáforo</div>
    <div style="overflow-x:auto">
    <table><thead><tr><th>Mes</th><th class="n">Resp.</th><th class="n">NPS</th><th class="n">Claridad</th><th class="n">Velocidad</th><th class="n">Calidad</th><th class="n">Satisf.</th></tr></thead><tbody>
    ${md.filter(d=>d.n>0).map(d=>`<tr>
      <td><b>${MN[d.m]||d.m} 2026</b> ${d.m===nowMes?'<span style="font-size:10px;background:rgba(34,201,122,.15);color:var(--ok);padding:2px 7px;border-radius:6px;font-weight:700;margin-left:4px">Actual</span>':''}</td>
      <td class="n">${d.n}</td>
      <td class="n"><span class="tag ${d.np>=60?'g':d.np>=30?'o':'r'}">${d.np}</span></td>
      <td class="n" style="color:${col(d.cl)};font-weight:700">${d.cl}</td>
      <td class="n" style="color:${col(d.ve)};font-weight:700">${d.ve}</td>
      <td class="n" style="color:${col(d.ca)};font-weight:700">${d.ca}</td>
      <td class="n" style="color:${col(d.sa)};font-weight:700">${d.sa}</td>
    </tr>`).join('')}
    ${(()=>{const tot=data.length;const avgRows=md.filter(d=>d.n>0);return tot>0?`<tr style="background:rgba(255,255,255,.03)"><td><b>Promedio global</b></td><td class="n"><b>${tot}</b></td><td class="n"><span class="tag ${npsScore(data.map(r=>r.nps))>=60?'g':'o'}">${npsScore(data.map(r=>r.nps))}</span></td><td class="n" style="color:${col(avg(data.map(r=>r.claridad)))}; font-weight:700"><b>${avg(data.map(r=>r.claridad))}</b></td><td class="n" style="color:${col(avg(data.map(r=>r.velocidad)))};font-weight:700"><b>${avg(data.map(r=>r.velocidad))}</b></td><td class="n" style="font-weight:700"><b>${avg(data.map(r=>r.calidad))}</b></td><td class="n" style="font-weight:700"><b>${avg(data.map(r=>r.satisfaccion))}</b></td></tr>`:'';})()}
    </tbody></table>
    </div>
  </div>`;

  // mes filter function
  window.filterMes=function(mes,btn){
    document.querySelectorAll('.mes-chip').forEach(c=>{
      const isCurrent=c.dataset.mes===nowMes;
      c.style.background=isCurrent?'rgba(34,201,122,.08)':'var(--inp)';
      c.style.color=isCurrent?'var(--ok)':'var(--txt2)';
      c.style.borderColor=isCurrent?'rgba(34,201,122,.4)':'var(--ln)';
    });
    btn.style.background='var(--acc)';
    btn.style.color='#fff';
    btn.style.borderColor='var(--acc)';
    const md2=data.filter(r=>r.mes===mes);
    const cont=document.getElementById('mes-detail-container');
    if(!md2.length){cont.innerHTML=`<div style="background:rgba(34,201,122,.06);border:1px solid rgba(34,201,122,.15);border-radius:12px;padding:18px 20px;margin-bottom:16px;font-size:13.5px;color:var(--txt2)">📍 <strong style="color:var(--txt)">${MN[mes]||mes} 2026</strong> es el mes en curso — aún no hay respuestas registradas.</div>`;return;}
    const np=npsScore(md2.map(r=>r.nps));
    const dims=[['📋 Claridad',avg(md2.map(r=>r.claridad))],['⚡ Velocidad',avg(md2.map(r=>r.velocidad))],['🎯 Calidad',avg(md2.map(r=>r.calidad))],['⭐ Satisfacción',avg(md2.map(r=>r.satisfaccion))]];
    cont.innerHTML=`<div style="background:var(--card);border:1.5px solid rgba(232,67,26,.3);border-radius:14px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div><div style="font-size:16px;font-weight:700">${MN[mes]||mes} 2026 — Detalle del mes</div><div style="font-size:12px;color:var(--txt2)">${md2.length} respuestas · NPS: <span style="color:${np>=60?OK:np>=30?ACC2:ERR};font-weight:700">${np}</span></div></div>
        <span class="tag ${np>=60?'g':np>=30?'o':'r'}" style="font-size:13px;padding:6px 14px">NPS ${np}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        ${dims.map(([nm,v])=>`<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px 14px"><div style="font-size:12px;color:var(--txt2);margin-bottom:5px">${nm}</div><div style="font-size:24px;font-weight:700;color:${col(v)}">${v}</div><div style="height:4px;background:rgba(255,255,255,.07);border-radius:2px;margin-top:7px"><div style="height:100%;width:${+v*10}%;background:${col(v)};border-radius:2px"></div></div></div>`).join('')}
      </div>
    </div>`;
  };
  window.clearMesFil=function(){
    document.querySelectorAll('.mes-chip').forEach(c=>{
      const isCurrent=c.dataset.mes===nowMes;
      c.style.background=isCurrent?'rgba(34,201,122,.08)':'var(--inp)';
      c.style.color=isCurrent?'var(--ok)':'var(--txt2)';
      c.style.borderColor=isCurrent?'rgba(34,201,122,.4)':'var(--ln)';
    });
    document.getElementById('mes-detail-container').innerHTML='';
  };

  setTimeout(()=>{
    dc('c_mm');dc('c_mvol');dc('c_mnps2');
    const mdWithData=md.filter(d=>d.n>0);

    charts['c_mm']=new Chart(document.getElementById('c_mm'),{type:'line',data:{labels:mdWithData.map(d=>MN[d.m]||d.m),datasets:[
      {label:'Claridad',data:mdWithData.map(d=>d.cl),borderColor:OK,tension:.4,borderWidth:2.5,pointRadius:4,pointBackgroundColor:OK},
      {label:'Velocidad',data:mdWithData.map(d=>d.ve),borderColor:ERR,tension:.4,borderWidth:2.5,pointRadius:4,borderDash:[5,3],pointBackgroundColor:ERR},
      {label:'Calidad',data:mdWithData.map(d=>d.ca),borderColor:ACC,tension:.4,borderWidth:2.5,pointRadius:4,pointBackgroundColor:ACC},
      {label:'Satisfacción',data:mdWithData.map(d=>d.sa),borderColor:'rgba(255,255,255,.5)',tension:.4,borderWidth:2.5,pointRadius:4,borderDash:[2,2],pointBackgroundColor:'rgba(255,255,255,.5)'}
    ]},options:{...CO,plugins:{...CO.plugins,legend:{display:true,labels:{color:'rgba(255,255,255,.5)',usePointStyle:true,pointStyle:'circle',font:{size:11},padding:10}}},scales:{x:{grid:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{min:0,max:10,grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}}}}});

    charts['c_mvol']=new Chart(document.getElementById('c_mvol'),{type:'bar',data:{labels:mdWithData.map(d=>MN[d.m]||d.m),datasets:[{data:mdWithData.map(d=>d.n),backgroundColor:mdWithData.map(d=>d.m===nowMes?OK:ACC),borderRadius:6}]},options:{...CO,scales:{x:{grid:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)',stepSize:5}}},plugins:{...CO.plugins,tooltip:{callbacks:{label:c=>c.parsed.y+' respuestas'}}}}});

    charts['c_mnps2']=new Chart(document.getElementById('c_mnps2'),{type:'line',data:{labels:mdWithData.map(d=>MN[d.m]||d.m),datasets:[{data:mdWithData.map(d=>d.np),borderColor:ACC,backgroundColor:'rgba(232,67,26,.06)',fill:true,tension:.4,borderWidth:2.5,pointRadius:5,pointBackgroundColor:mdWithData.map(d=>d.np>=60?OK:d.np>=30?ACC:ERR),pointBorderColor:'#080808',pointBorderWidth:2}]},options:{...CO,scales:{x:{grid:{display:false},ticks:{color:'rgba(255,255,255,.4)'}},y:{grid:{color:'rgba(255,255,255,.05)'},border:{display:false},ticks:{color:'rgba(255,255,255,.4)'}}}}});
  },60);
}

/* ══════════════════════════════════════════════
   COMENTARIOS
══════════════════════════════════════════════ */
function rCo(data){
  const el=document.getElementById('dt-comentarios');
  const as=['Todos',...[...new Set(data.map(r=>r.asesor))].sort()];
  const sv=['Todos',...[...new Set(data.map(r=>r.servicio))].sort()];
  el.innerHTML=`
  <div style="background:rgba(34,201,122,.05);border:1px solid rgba(34,201,122,.14);border-radius:12px;padding:13px 16px;margin-bottom:14px;font-size:13px;color:var(--txt2);line-height:1.5">
    <strong style="color:var(--txt)">💡 Guía:</strong>
    <span style="color:${ERR}">● Rojo = detractor (NPS ≤ 6)</span> ·
    <span style="color:${ACC2}">● Naranja = pasivo (7–8)</span> ·
    <span style="color:${OK}">● Verde = promotor (9–10)</span>
  </div>
  <div class="fil">
    <select id="fs-a">${as.map(a=>`<option>${a}</option>`).join('')}</select>
    <select id="fs-s">${sv.map(s=>`<option>${s}</option>`).join('')}</select>
    <select id="fs-o"><option value="asc">Críticos primero</option><option value="desc">Promotores primero</option></select>
    <button class="btn-fil" onclick="aplFil()">Filtrar</button>
  </div>
  <div id="colist"></div>`;

  window.aplFil=async function(){
    const all=await loadAll();
    const fa=document.getElementById('fs-a').value;
    const fs=document.getElementById('fs-s').value;
    const fo=document.getElementById('fs-o').value;
    let f=all.filter(r=>r.comentario&&r.comentario.trim().length>4);
    if(fa!=='Todos')f=f.filter(r=>r.asesor===fa);
    if(fs!=='Todos')f=f.filter(r=>r.servicio===fs);
    f.sort((a,b)=>fo==='asc'?a.nps-b.nps:b.nps-a.nps);
    document.getElementById('colist').innerHTML=`
      <div style="font-size:12px;color:var(--txt2);margin-bottom:12px;font-weight:600">${f.length} comentarios</div>
      ${f.map(r=>`<div class="ci ${r.nps<=6?'crit':r.nps>=9?'good':''}">
        <div class="cmeta">
          <span class="tag ${r.nps>=9?'g':r.nps>=7?'o':'r'}">NPS ${r.nps}</span>
          <b style="color:var(--txt)">${r.asesor}</b>
          <span>${r.servicio}</span>
          <span>${r.fecha_str}</span>
          ${r.email?`<span style="color:${ACC};font-size:10px">${r.email}</span>`:''}
        </div>
        <div class="ctxt">"${r.comentario}"</div>
      </div>`).join('')}`;
  };
  aplFil();
}
