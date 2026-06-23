const LOCAL_SK='ulpik_nps_local';
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

const sel={asesor:null,servicio:null};
const scv={nps:null,claridad:null,velocidad:null,calidad:null,satisfaccion:null};

const SMSG={1:'😞 Muy malo',2:'😟 Malo',3:'😕 Por debajo de lo esperado',4:'😐 Regular',5:'🤔 Podría mejorar',6:'🙂 Aceptable',7:'😊 Bien',8:'😄 Muy bien',9:'🌟 Excelente',10:'🏆 ¡Superó todas las expectativas!'};

window.addEventListener('load',()=>{buildScales();buildOpts();
  const wm=document.querySelector('.hero-watermark img'),sw=document.querySelector('.succ-watermark');
  if(wm&&sw)sw.appendChild(wm.cloneNode(true));
});

function buildOpts(){
  document.querySelectorAll('.opt[data-group]').forEach(opt=>{
    opt.addEventListener('click',()=>selectOpt(opt));
    opt.setAttribute('tabindex','0');
    opt.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();selectOpt(opt);}});
  });
}
function selectOpt(opt){
  const g=opt.dataset.group,v=opt.dataset.val;
  document.querySelectorAll('.opt[data-group="'+g+'"]').forEach(o=>o.classList.remove('sel'));
  opt.classList.add('sel');
  sel[g]=v;
  const stp=opt.closest('.stp');
  if(stp){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  updateProgress();
}
function buildScales(){
  SCALES.forEach(id=>{
    const wrap=document.getElementById('sc-'+id);
    if(!wrap)return;
    for(let i=1;i<=10;i++){
      const b=document.createElement('button');
      b.type='button';b.className='sbtn';b.textContent=String(i);
      (function(val,sid,w,btn){
        btn.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();
          scv[sid]=val;
          w.querySelectorAll('.sbtn').forEach((x,j)=>x.classList.toggle('sel',j+1===val));
          const stp=document.getElementById('s-'+sid);
          stp.classList.remove('bad');stp.classList.add('done');markDone(stp);
          const sm=document.getElementById('sm-'+sid);
          sm.textContent=SMSG[val]||val+'/10';sm.className='score-msg set';
          updateProgress();
        });
      })(i,id,wrap,b);
      wrap.appendChild(b);
    }
  });
}
function markDone(stp){const n=stp.querySelector('.stp-num');if(n&&stp.classList.contains('done'))n.textContent='✓';}
function resetStp(stp, num){
  if(!stp)return;
  stp.classList.remove('done','bad');
  const n=stp.querySelector('.stp-num');
  if(n&&num!=null)n.textContent=String(num);
}
function onEmailInput(){
  const v=document.getElementById('f-email').value.trim();
  const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const stp=document.getElementById('s-email');
  if(ok){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  else resetStp(stp,1);
  updateProgress();
}
function onComentInput(){
  const v=document.getElementById('f-comentario').value;
  document.getElementById('char-n').textContent=v.length;
  const stp=document.getElementById('s-comentario');
  if(v.trim().length>=5){stp.classList.remove('bad');stp.classList.add('done');markDone(stp);}
  else resetStp(stp,9);
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
function showToast(msg,t='ok'){
  const el=document.getElementById('toast');
  el.textContent=(t==='ok'?'✓  ':t==='er'?'✗  ':'ℹ  ')+msg;
  el.className='toast show '+t;
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),5000);
}

async function submitForm(){
  let valid=true;
  document.querySelectorAll('.stp.bad').forEach(s=>s.classList.remove('bad'));
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
  const btn=document.getElementById('btn-sub');
  const btnTxt=document.getElementById('btn-txt');
  const spin=document.getElementById('spin');
  btn.disabled=true;
  btn.classList.add('loading');
  spin.style.display='block';
  btnTxt.textContent='Enviando...';

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
  sendNotif(entry,tituloUrl);

  // 4. Pantalla de éxito
  document.querySelector('.hero').style.display='none';
  document.getElementById('survey-form').style.display='none';
  document.getElementById('prog-wrap').style.display='none';
  document.querySelector('.foot')?.style.setProperty('display','none');
  document.getElementById('succ').classList.add('show');
  if(tituloUrl){const dl=document.getElementById('dl-btn');dl.href=tituloUrl;dl.style.display='inline-flex';}
  btn.disabled=false;
  btn.classList.remove('loading');
  spin.style.display='none';
  btnTxt.textContent='Enviar mi calificación →';
  window.scrollTo({top:0,behavior:'smooth'});
  window.scrollTo({top:0,behavior:'smooth'});
}

function sendNotif(e,tUrl){
  const critico=e.nps<=6||e.velocidad<=5||e.calidad<=5;
  const avg5=((e.nps+e.claridad+e.velocidad+e.calidad+e.satisfaccion)/5).toFixed(1);
  const txt=`Nueva encuesta NPS — ${e.fecha_str} ${e.hora} | ${e.email} | Asesor: ${e.asesor} | Servicio: ${e.servicio}
Promedio: ${avg5}/10 | NPS:${e.nps} Claridad:${e.claridad} Velocidad:${e.velocidad} Calidad:${e.calidad} Satisfacción:${e.satisfaccion}
Comentario: "${e.comentario}"
${critico?'⚠️ CRÍTICO — contacto en 24h':''}
${tUrl?'Título: '+tUrl:'Sin título configurado'}`;
  console.log('%c📧 NOTIFICACIÓN → '+NOTIFY,'color:#E8431A;font-weight:bold');
  console.log(txt);
}
