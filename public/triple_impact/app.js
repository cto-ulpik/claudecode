const DIMS = {
  social:    {name:"Social",                 hex:"#7C5CD6"},
  ambiental: {name:"Ambiental",              hex:"#10917A"},
  economico: {name:"Económico y gobernanza", hex:"#E08A1E"}
};
const LEVELS = [
  {min:80,max:100,name:"Empresa Referente"},
  {min:60,max:79, name:"Empresa Comprometida"},
  {min:40,max:59, name:"Empresa en transición"},
  {min:0, max:39, name:"Empresa Inicial"}
];
function levelOf(n){ return LEVELS.find(l=> n>=l.min && n<=l.max); }

const $ = id => document.getElementById(id);
const screens = {intro:$("screenIntro"), load:$("screenLoad"), res:$("screenRes")};
const esc = t => String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const kb = b => b<1048576 ? Math.round(b/1024)+" KB" : (b/1048576).toFixed(1)+" MB";

let picked = null;
let extractedText = "";
let evaluation = null;
const meta = {empresa:"", analista:"", nota:"", redesUrls:"", redes:""};

function show(w){
  Object.values(screens).forEach(s=>s.classList.add("hidden"));
  screens[w].classList.remove("hidden");
  screens[w].classList.remove("fade"); void screens[w].offsetWidth; screens[w].classList.add("fade");
  $("restartTop").classList.toggle("hidden", w==="intro");
  window.scrollTo({top:0,behavior:"instant"});
}

function setFile(file){
  const okPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const okDoc = file.name.toLowerCase().endsWith(".docx");
  if(!okPdf && !okDoc){ alert("Formato no admitido. Sube un PDF o un .docx."); return; }
  if(file.size > 40*1024*1024){ alert("El archivo pesa más de 40 MB."); return; }
  picked = {name:file.name, size:file.size, type: okPdf?"pdf":"docx", file};
  $("pasteBox").value = ""; $("pasteBox").disabled = true;
  renderPill(); refreshBtn();
}
function renderPill(){
  if(!picked){ $("filePill").innerHTML=""; return; }
  $("filePill").innerHTML =
    '<div class="filepill"><div class="fi">'+(picked.type==="pdf"?"PDF":"DOCX")+'</div>'+
    '<div class="fm"><div class="fn">'+esc(picked.name)+'</div><div class="fs">'+kb(picked.size)+'</div></div>'+
    '<button class="frm" id="rmFile" title="Quitar">×</button></div>';
  $("rmFile").onclick = ()=>{ picked=null; $("pasteBox").disabled=false; renderPill(); refreshBtn(); };
}
function refreshBtn(){
  $("evalBtn").disabled = !(picked || $("pasteBox").value.trim().length > 40);
}
$("pickBtn").onclick = ()=> $("fileInput").click();
$("fileInput").onchange = e=>{ if(e.target.files[0]) setFile(e.target.files[0]); e.target.value=""; };
$("pasteBox").addEventListener("input", refreshBtn);
const drop = $("drop");
["dragenter","dragover"].forEach(ev=> drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over");}));
["dragleave","drop"].forEach(ev=> drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over");}));
drop.addEventListener("drop", e=>{ if(e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });

async function extractPdf(file){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  const maxPages = Math.min(pdf.numPages, 80);
  let out = [];
  for(let p=1; p<=maxPages; p++){
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    out.push(tc.items.map(i=>i.str).join(" "));
    $("loadMsg").textContent = "Extrayendo página " + p + " de " + maxPages + "…";
  }
  return out.join("\n").replace(/\s+\n/g,"\n").trim();
}
async function extractDocx(file){
  const buf = await file.arrayBuffer();
  const r = await mammoth.extractRawText({arrayBuffer:buf});
  return (r.value||"").trim();
}

function sliceJSONObject(s){
  const start = s.indexOf("{");
  if(start < 0) return null;
  let depth = 0, inStr = false, escaped = false;
  for(let i = start; i < s.length; i++){
    const c = s[i];
    if(inStr){
      if(escaped) escaped = false;
      else if(c === "\\") escaped = true;
      else if(c === '"') inStr = false;
    } else {
      if(c === '"') inStr = true;
      else if(c === "{") depth++;
      else if(c === "}"){ depth--; if(depth === 0) return s.slice(start, i+1); }
    }
  }
  return s.slice(start);
}

function repairJSON(raw){
  let s = raw;
  let out = "", inStr = false, escaped = false;
  for(let i = 0; i < s.length; i++){
    const c = s[i];
    if(inStr){
      if(escaped){ out += c; escaped = false; continue; }
      if(c === "\\"){ out += c; escaped = true; continue; }
      if(c === '"'){ out += c; inStr = false; continue; }
      if(c === "\n" || c === "\r"){ out += "\\n"; continue; }
      if(c === "\t"){ out += "\\t"; continue; }
      out += c;
    } else {
      if(c === '"'){ out += c; inStr = true; continue; }
      out += c;
    }
  }
  s = out;
  if(inStr) s += '"';
  s = s.replace(/,\s*([}\]])/g, "$1");
  let open = 0, sq = 0; inStr = false; escaped = false;
  for(let i = 0; i < s.length; i++){
    const c = s[i];
    if(inStr){
      if(escaped) escaped = false;
      else if(c === "\\") escaped = true;
      else if(c === '"') inStr = false;
    } else {
      if(c === '"') inStr = true;
      else if(c === "{") open++;
      else if(c === "}") open--;
      else if(c === "[") sq++;
      else if(c === "]") sq--;
    }
  }
  while(sq-- > 0) s += "]";
  while(open-- > 0) s += "}";
  s = s.replace(/,\s*([}\]])/g, "$1");
  return s;
}

function parseEvaluation(rawText){
  let txt = rawText.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```\s*$/,"").trim();
  const isolated = sliceJSONObject(txt) || txt;
  const candidates = [isolated, repairJSON(isolated)];
  for(const cand of candidates){
    try{ return JSON.parse(cand); }catch(_){ /* siguiente */ }
  }
  throw new Error("PARSE");
}

async function requestModel(text){
  const r = await fetch("/api/triple-impact/evaluate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      text,
      redes: meta.redes || "",
      redesUrls: meta.redesUrls || ""
    })
  });
  let data = {};
  try { data = await r.json(); } catch (_) { /* ignore */ }
  if(!r.ok){
    throw new Error(data.error || ("La evaluación falló (código " + r.status + "). Reintenta en un momento."));
  }
  return String(data.content || "").trim();
}

async function callModel(text){
  let parsed = null, lastErr = null;
  for(let attempt = 0; attempt < 2 && !parsed; attempt++){
    try{
      const raw = await requestModel(text);
      parsed = parseEvaluation(raw);
    }catch(err){
      lastErr = err;
      if(err.message !== "PARSE") throw err;
      if(attempt === 0){ $("loadMsg").textContent = "Ajustando el formato de la respuesta…"; }
    }
  }
  if(!parsed) throw new Error("El modelo devolvió un formato inesperado dos veces seguidas. Vuelve a intentarlo; si persiste, prueba con un fragmento más corto del brief.");

  if(!parsed.dimensiones) parsed.dimensiones = {};
  ["social","ambiental","economico"].forEach(k=>{
    const d = parsed.dimensiones[k] || {};
    parsed.dimensiones[k] = {
      nota: clampNota(d.nota),
      resumen: d.resumen || "Sin información suficiente en el documento para esta dimensión.",
      fortalezas: Array.isArray(d.fortalezas) ? d.fortalezas : [],
      vacios: Array.isArray(d.vacios) ? d.vacios : []
    };
  });
  parsed.indice = clampNota(parsed.indice);
  parsed.veredicto = parsed.veredicto || "El documento no aporta evidencia suficiente para un veredicto firme.";
  parsed.recomendada = parsed.recomendada || "—";
  parsed.alertas = Array.isArray(parsed.alertas) ? parsed.alertas : [];
  parsed.recomendaciones = Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones : [];
  parsed.citas = Array.isArray(parsed.citas) ? parsed.citas : [];

  const rv = parsed.redes_vs_brief || {};
  parsed.redes_vs_brief = {
    resumen: rv.resumen || "Sin contraste de redes disponible.",
    alineaciones: Array.isArray(rv.alineaciones) ? rv.alineaciones : [],
    contradicciones: Array.isArray(rv.contradicciones) ? rv.contradicciones : [],
    solo_storytelling: Array.isArray(rv.solo_storytelling) ? rv.solo_storytelling : [],
    verificar: Array.isArray(rv.verificar) ? rv.verificar : [],
    material_redes: rv.material_redes || (meta.redes ? "aportado" : "no aportado")
  };

  const bn = parsed.briefing_nico || {};
  const fr = bn.ficha_rapida || {};
  const sm = bn.semaforo || {};
  parsed.briefing_nico = {
    ficha_rapida: {
      empresa: fr.empresa || parsed.empresa_detectada || meta.empresa || "",
      fundador: fr.fundador || "[SUPUESTO] desconocido",
      sector: fr.sector || "",
      tamano: fr.tamano || "desconocido",
      tiempo_operando: fr.tiempo_operando || "",
      mercado: fr.mercado || "desconocido"
    },
    semaforo: {
      planeta: normalizeLight(sm.planeta),
      personas: normalizeLight(sm.personas),
      utilidad: normalizeLight(sm.utilidad),
      justificacion: sm.justificacion || ""
    },
    evidencia: Array.isArray(bn.evidencia) ? bn.evidencia : [],
    relato: Array.isArray(bn.relato) ? bn.relato : [],
    gancho_entrevista: bn.gancho_entrevista || "",
    preguntas_fuertes: Array.isArray(bn.preguntas_fuertes) ? bn.preguntas_fuertes : [],
    riesgos_reputacionales: Array.isArray(bn.riesgos_reputacionales) ? bn.riesgos_reputacionales : [],
    fit_marca: bn.fit_marca || "",
    recomendacion_final: bn.recomendacion_final || (parsed.recomendada || "—")
  };
  return parsed;
}

function normalizeLight(v){
  const s = String(v||"").toLowerCase();
  if(s.includes("verd") || s === "green") return "verde";
  if(s.includes("amar") || s === "yellow") return "amarillo";
  if(s.includes("roj") || s === "red") return "rojo";
  return "amarillo";
}

function lightEmoji(v){
  return v==="verde"?"🟢":v==="rojo"?"🔴":"🟡";
}

function lightHex(v){
  return v==="verde"?"var(--green)":v==="rojo"?"var(--red)":"var(--amber)";
}

function clampNota(n){
  const v = Math.round(Number(n));
  if(!isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function markStep(id, state){
  const el = $(id);
  el.classList.remove("on","doing");
  if(state) el.classList.add(state);
}

$("evalBtn").onclick = async ()=>{
  meta.empresa = $("inEmpresa").value.trim();
  meta.analista = $("inAnalista").value.trim();
  meta.redesUrls = $("inRedesUrls").value.trim();
  meta.redes = $("redesBox").value.trim();
  show("load");
  $("loadErr").innerHTML = "";
  ["st1","st2","st3","st4","st5"].forEach(s=>markStep(s,null));
  markStep("st1","doing");
  $("loadTitle").textContent = "Leyendo el documento…";
  try{
    if(picked){
      extractedText = picked.type==="pdf" ? await extractPdf(picked.file) : await extractDocx(picked.file);
    } else {
      extractedText = $("pasteBox").value.trim();
    }
    if(!extractedText || extractedText.length < 40)
      throw new Error("No se pudo extraer texto legible. Si el PDF es escaneado (imágenes), pégalo como texto o sube una versión con texto seleccionable.");
    markStep("st1","on"); markStep("st2","doing");
    $("loadTitle").textContent = "Analizando las tres dimensiones…";
    $("loadMsg").textContent = "El modelo está leyendo " + extractedText.length.toLocaleString("es") + " caracteres.";
    setTimeout(()=>{ markStep("st2","on"); markStep("st3","doing"); $("loadTitle").textContent="Calibrando contra el mínimo legal…"; }, 1600);
    setTimeout(()=>{ markStep("st3","on"); markStep("st4","doing"); $("loadTitle").textContent="Contrastando redes y armando briefing Nico…"; }, 3200);
    setTimeout(()=>{ markStep("st4","on"); markStep("st5","doing"); $("loadTitle").textContent="Redactando el veredicto…"; }, 5000);
    evaluation = await callModel(extractedText);
    ["st1","st2","st3","st4","st5"].forEach(s=>markStep(s,"on"));
    renderResults();
    show("res");
  }catch(err){
    $("loadErr").innerHTML = '<div class="errbox"><b>No se pudo completar la evaluación</b>'+esc(err.message||String(err))+
      '<div style="margin-top:12px"><button class="ghost" id="backBtn">Volver</button></div></div>';
    $("backBtn").onclick = ()=> show("intro");
  }
};

function radarSVG(sc){
  const size=300, cx=size/2, cy=size/2+8, R=104;
  const axes=[{k:"social",l:"Social",a:-90},{k:"economico",l:"Económico",a:30},{k:"ambiental",l:"Ambiental",a:150}];
  const pt=(a,r)=>{const rad=a*Math.PI/180;return[cx+Math.cos(rad)*r,cy+Math.sin(rad)*r];};
  const ring=r=>axes.map(x=>pt(x.a,r).join(",")).join(" ");
  let s='<svg viewBox="0 0 '+size+' '+(size+18)+'" width="100%" style="max-width:330px" role="img" aria-label="Radar de dimensiones">';
  [20,60,80,100].forEach(v=> s+='<polygon points="'+ring(R*v/100)+'" fill="none" stroke="#E2E7E3" stroke-width="1"/>');
  s+='<polygon points="'+ring(R*0.4)+'" fill="none" stroke="#10201C" stroke-width="1.4" stroke-dasharray="4 4" opacity="0.55"/>';
  axes.forEach(x=>{const p=pt(x.a,R);s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="#E2E7E3"/>';});
  s+='<polygon points="'+axes.map(x=>pt(x.a,R*Math.max(sc[x.k],2)/100).join(",")).join(" ")+'" fill="rgba(16,32,28,0.10)" stroke="#10201C" stroke-width="2" stroke-linejoin="round"/>';
  axes.forEach(x=>{const p=pt(x.a,R*Math.max(sc[x.k],2)/100);s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+DIMS[x.k].hex+'" stroke="#fff" stroke-width="2"/>';});
  axes.forEach(x=>{
    const p=pt(x.a,R+30), anchor=x.a===-90?"middle":(x.a===30?"start":"end"), dx=x.a===30?-14:(x.a===150?14:0);
    s+='<text x="'+(p[0]+dx)+'" y="'+p[1]+'" text-anchor="'+anchor+'" font-family="Inter" font-size="12.5" font-weight="600" fill="#10201C">'+x.l+'</text>';
    s+='<text x="'+(p[0]+dx)+'" y="'+(p[1]+16)+'" text-anchor="'+anchor+'" font-family="IBM Plex Mono" font-size="12" fill="'+DIMS[x.k].hex+'">'+sc[x.k]+'</text>';
  });
  return s+'</svg>';
}

function buildNicoReport(){
  const e = evaluation;
  const b = e.briefing_nico;
  const f = b.ficha_rapida;
  const s = b.semaforo;
  const rv = e.redes_vs_brief;
  const L=[];
  L.push("BRIEFING PARA NICO — MARCAS QUE IMPACTAN");
  L.push("========================================");
  L.push("Analista: " + (meta.analista||"—"));
  L.push("Fecha: " + new Date().toLocaleDateString("es-EC",{year:"numeric",month:"long",day:"numeric"}));
  L.push("Índice Triple Impacto (interno): " + e.indice + "/100");
  L.push("");
  L.push("1. FICHA RÁPIDA");
  L.push("--------------");
  L.push("Empresa: " + (f.empresa||"—"));
  L.push("Fundador(a): " + (f.fundador||"—"));
  L.push("Sector: " + (f.sector||"—"));
  L.push("Tamaño: " + (f.tamano||"—"));
  L.push("Tiempo operando: " + (f.tiempo_operando||"—"));
  L.push("Mercado: " + (f.mercado||"—"));
  L.push("");
  L.push("2. SEMÁFORO DE TRIPLE IMPACTO");
  L.push("----------------------------");
  L.push("Planeta: " + lightEmoji(s.planeta) + " " + s.planeta);
  L.push("Personas: " + lightEmoji(s.personas) + " " + s.personas);
  L.push("Utilidad / gobernanza: " + lightEmoji(s.utilidad) + " " + s.utilidad);
  L.push("");
  L.push("Justificación (3 líneas):");
  L.push(s.justificacion || "—");
  L.push("");
  L.push("3. EVIDENCIA VS. RELATO");
  L.push("----------------------");
  L.push("Comprobado:");
  (b.evidencia||[]).forEach(x=> L.push("  ✓ " + x));
  if(!(b.evidencia||[]).length) L.push("  (sin evidencia dura clara)");
  L.push("Storytelling / [SUPUESTO]:");
  (b.relato||[]).forEach(x=> L.push("  · " + x));
  if(!(b.relato||[]).length) L.push("  (sin notas)");
  L.push("");
  L.push("4. CONTRASTE BRIEF VS REDES");
  L.push("--------------------------");
  L.push("Material de redes: " + (rv.material_redes||"—"));
  L.push(rv.resumen||"—");
  if((rv.alineaciones||[]).length){
    L.push("Alineaciones:");
    rv.alineaciones.forEach(x=> L.push("  + " + x));
  }
  if((rv.contradicciones||[]).length){
    L.push("Contradicciones / tensiones:");
    rv.contradicciones.forEach(x=> L.push("  ! " + x));
  }
  if((rv.solo_storytelling||[]).length){
    L.push("Solo storytelling:");
    rv.solo_storytelling.forEach(x=> L.push("  · " + x));
  }
  if((rv.verificar||[]).length){
    L.push("Verificar aún:");
    rv.verificar.forEach(x=> L.push("  ? " + x));
  }
  L.push("");
  L.push("5. GANCHO DE ENTREVISTA");
  L.push("----------------------");
  L.push(b.gancho_entrevista || "—");
  L.push("");
  L.push("6. PREGUNTAS FUERTES");
  L.push("-------------------");
  (b.preguntas_fuertes||[]).forEach((q,i)=> L.push((i+1)+". " + q));
  if(!(b.preguntas_fuertes||[]).length) L.push("—");
  L.push("");
  L.push("7. RIESGOS REPUTACIONALES");
  L.push("------------------------");
  (b.riesgos_reputacionales||[]).forEach(x=> L.push("  · " + x));
  if(!(b.riesgos_reputacionales||[]).length) L.push("  Ninguno evidente");
  L.push("");
  L.push("8. FIT CON LA MARCA MQI / NICO");
  L.push("-----------------------------");
  L.push(b.fit_marca || "—");
  L.push("");
  L.push("9. RECOMENDACIÓN FINAL");
  L.push("---------------------");
  L.push(b.recomendacion_final || "—");
  L.push("");
  L.push("-----------------------------------------------");
  L.push("Generado con Triple Impact Check · Marcas que Impactan.");
  L.push("Documento interno para preparación de entrevista. No es una certificación.");
  return L.join("\n");
}

// Las fuentes estándar de jsPDF solo cubren Latin-1: normaliza comillas/guiones y quita emojis.
function pdfSafe(t){
  return String(t==null?"":t)
    .replace(/[“”„]/g,'"').replace(/[‘’]/g,"'")
    .replace(/[–—]/g,"-").replace(/…/g,"...").replace(/[•●]/g,"·")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g,"").replace(/ {2,}/g," ").trim();
}

function buildNicoPdf(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"mm", format:"a4"});
  const W=210, H=297, M=18, CW=W-2*M;
  const C = {ink:[16,32,28], muted:[95,110,104], faint:[138,151,145], line:[226,231,227], paper:[244,246,243],
    green:[16,145,122], amber:[224,138,30], red:[200,72,47], white:[255,255,255]};
  const LIGHT = {verde:C.green, amarillo:C.amber, rojo:C.red};
  const e = evaluation, b = e.briefing_nico, f = b.ficha_rapida, s = b.semaforo, rv = e.redes_vs_brief;
  const emp = f.empresa || meta.empresa || e.empresa_detectada || "Empresa evaluada";
  const fecha = new Date().toLocaleDateString("es-EC",{year:"numeric",month:"long",day:"numeric"});
  const lh = size => size*0.3528*1.4;
  let y = 0;

  const ensure = h=>{ if(y+h > H-20){ doc.addPage(); y = M; } };
  const font = (size, style, color)=>{ doc.setFont("helvetica", style||"normal"); doc.setFontSize(size); doc.setTextColor(...(color||C.ink)); };
  const para = (txt, o)=>{
    o = o || {};
    const size = o.size || 10, indent = o.indent || 0;
    font(size, o.style, o.color);
    const lines = doc.splitTextToSize(pdfSafe(txt) || "-", CW-indent);
    lines.forEach(l=>{ ensure(lh(size)); doc.text(l, M+indent, y+lh(size)*0.75); y += lh(size); });
    y += o.gap==null ? 1.6 : o.gap;
  };
  const heading = (n, t)=>{
    ensure(16); y += 5;
    font(9, "bold", C.green); doc.text(String(n).padStart(2,"0"), M, y+4);
    font(12.5, "bold"); doc.text(pdfSafe(t), M+8, y+4);
    y += 6.5; doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.line(M, y, W-M, y); y += 4;
  };
  const sub = t=>{ ensure(9); y += 1; font(8.5, "bold", C.muted); doc.text(pdfSafe(t).toUpperCase(), M, y+3); y += 5.5; };
  const bullets = (arr, mark, color, empty)=>{
    if(!arr || !arr.length){ para(empty, {color:C.faint, style:"italic"}); return; }
    arr.forEach((x,i)=>{
      ensure(lh(10));
      font(10, "bold", color); doc.text(typeof mark==="function" ? mark(i) : mark, M+1, y+lh(10)*0.75);
      para(x, {indent:7, gap:1.2});
    });
  };
  const cell = (x, cy, w, h, label)=>{
    doc.setFillColor(...C.paper); doc.setDrawColor(...C.line); doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, w, h, 1.5, 1.5, "FD");
    font(7, "bold", C.faint); doc.text(pdfSafe(label).toUpperCase(), x+3.5, cy+5);
  };

  // Cabecera
  doc.setFillColor(...C.ink); doc.rect(0, 0, W, 46, "F");
  font(8.5, "bold", C.green); doc.text("BRIEFING PARA NICO · MARCAS QUE IMPACTAN", M, 15);
  font(20, "bold", C.white);
  const title = doc.splitTextToSize(pdfSafe(emp), CW-40).slice(0,2);
  doc.text(title, M, 25);
  font(9, "normal", [190,200,195]);
  doc.text(pdfSafe("Analista: "+(meta.analista||"-")+"   ·   "+fecha), M, 25+title.length*8);
  font(26, "bold", C.white); doc.text(String(e.indice), W-M, 27, {align:"right"});
  font(7.5, "normal", [190,200,195]); doc.text("ÍNDICE TRIPLE IMPACTO /100", W-M, 33, {align:"right"});
  y = 54;

  heading(1, "Ficha rápida");
  const gap = 4, cw = (CW-2*gap)/3, ch = 17;
  [["Empresa",f.empresa||emp],["Fundador(a)",f.fundador],["Sector",f.sector],
   ["Tamaño",f.tamano],["Tiempo operando",f.tiempo_operando],["Mercado",f.mercado]].forEach((c,i)=>{
    if(i%3===0){ ensure(ch+gap); if(i) y += ch+gap; }
    const x = M + (i%3)*(cw+gap);
    cell(x, y, cw, ch, c[0]);
    font(9.5, "bold"); doc.text(doc.splitTextToSize(pdfSafe(c[1])||"-", cw-7).slice(0,2), x+3.5, y+10.5);
  });
  y += ch+3;

  heading(2, "Semáforo de triple impacto");
  ensure(ch+4);
  [["Planeta",s.planeta],["Personas",s.personas],["Utilidad / gobernanza",s.utilidad]].forEach((c,i)=>{
    const x = M + i*(cw+gap);
    cell(x, y, cw, ch, c[0]);
    doc.setFillColor(...(LIGHT[c[1]]||C.amber)); doc.circle(x+5.5, y+11, 2.2, "F");
    font(10, "bold"); doc.text(c[1].charAt(0).toUpperCase()+c[1].slice(1), x+10, y+12.2);
  });
  y += ch+4;
  sub("Justificación");
  para(s.justificacion || "-");

  heading(3, "Evidencia vs. relato");
  sub("Comprobado");
  bullets(b.evidencia, "+", C.green, "Sin evidencia dura clara.");
  sub("Storytelling / [SUPUESTO]");
  bullets(b.relato, "·", C.amber, "Sin notas.");

  heading(4, "Contraste brief vs redes");
  para("Material de redes: "+(rv.material_redes||"-"), {size:9, color:C.muted});
  para(rv.resumen || "-");
  if((rv.alineaciones||[]).length){ sub("Alineaciones"); bullets(rv.alineaciones, "+", C.green); }
  if((rv.contradicciones||[]).length){ sub("Contradicciones / tensiones"); bullets(rv.contradicciones, "!", C.red); }
  if((rv.solo_storytelling||[]).length){ sub("Solo storytelling"); bullets(rv.solo_storytelling, "·", C.amber); }
  if((rv.verificar||[]).length){ sub("Verificar aún"); bullets(rv.verificar, "?", C.muted); }

  heading(5, "Gancho de entrevista");
  const gy = y, gp = doc.getNumberOfPages();
  para(b.gancho_entrevista || "-", {size:11, style:"italic", indent:5});
  if(doc.getNumberOfPages()===gp){ doc.setDrawColor(...C.green); doc.setLineWidth(1); doc.line(M+1, gy, M+1, y-1.6); }

  heading(6, "Preguntas fuertes");
  bullets(b.preguntas_fuertes, i=>String(i+1)+".", C.green, "-");

  heading(7, "Riesgos reputacionales");
  bullets(b.riesgos_reputacionales, "!", C.red, "Ninguno evidente.");

  heading(8, "Fit con la marca MQI / Nico");
  para(b.fit_marca || "-");

  heading(9, "Recomendación final");
  para(b.recomendacion_final || "-", {style:"bold", size:11});

  const pages = doc.getNumberOfPages();
  for(let p=1; p<=pages; p++){
    doc.setPage(p);
    doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.line(M, H-14, W-M, H-14);
    font(7.5, "normal", C.faint);
    doc.text("Triple Impact Check · Marcas que Impactan · Documento interno para preparación de entrevista. No es una certificación.", M, H-9);
    doc.text(p+" / "+pages, W-M, H-9, {align:"right"});
  }
  return doc;
}

function buildReport(){
  const e = evaluation;
  const emp = meta.empresa || e.empresa_detectada || "(sin nombre)";
  const lvl = levelOf(e.indice);
  const L=[];
  L.push("TRIPLE IMPACT CHECK — EVALUACIÓN DE BRIEF (MQI)");
  L.push("===============================================");
  L.push("Empresa: " + emp);
  L.push("Analista MQI: " + (meta.analista||"(sin nombre)"));
  L.push("Fecha: " + new Date().toLocaleDateString("es-EC",{year:"numeric",month:"long",day:"numeric"}));
  L.push("Documento evaluado: " + (e.tipo_documento||"—") + (picked?(" · "+picked.name):" · texto pegado"));
  L.push("Confianza del análisis: " + (e.confianza||"—"));
  L.push("");
  L.push("ÍNDICE DE TRIPLE IMPACTO: " + e.indice + "/100  ("+lvl.name+")");
  L.push("Referencia: cumplir exactamente la ley ≈ 40/100. El 100 es la frontera global, casi inalcanzable.");
  L.push("¿Recomendada para MQI?: " + (e.recomendada||"—"));
  L.push("");
  L.push("VEREDICTO");
  L.push("---------");
  L.push(e.veredicto||"—");
  L.push("");
  ["social","ambiental","economico"].forEach(k=>{
    const d = e.dimensiones[k];
    L.push(DIMS[k].name.toUpperCase() + " — " + d.nota + "/100");
    L.push(d.resumen||"");
    (d.fortalezas||[]).forEach(f=> L.push("  + " + f));
    (d.vacios||[]).forEach(v=> L.push("  – " + v));
    L.push("");
  });
  if((e.alertas||[]).length){
    L.push("SEÑALES DE ALERTA");
    L.push("-----------------");
    e.alertas.forEach(a=> L.push("["+(a.nivel||"media").toUpperCase()+"] " + a.texto));
    L.push("");
  }
  L.push("RECOMENDACIONES PARA SUBIR LA NOTA");
  L.push("----------------------------------");
  (e.recomendaciones||[]).forEach((r,i)=> L.push((i+1)+". " + r));
  L.push("");
  if((e.citas||[]).length){
    L.push("CITAS DEL DOCUMENTO");
    L.push("-------------------");
    e.citas.forEach(c=> L.push('· "'+c.texto+'" → '+c.lectura));
    L.push("");
  }
  if(meta.nota.trim()){
    L.push("OBSERVACIONES DEL ANALISTA");
    L.push("--------------------------");
    L.push(meta.nota.trim());
    L.push("");
  }
  L.push("-----------------------------------------------");
  L.push("Generado con el Evaluador de Briefs de Marcas que Impactan.");
  L.push("Diagnóstico de madurez asistido por IA; no constituye una certificación. Calibrar con criterio de MQI.");
  return L.join("\n");
}

function renderResults(){
  const e = evaluation;
  const emp = meta.empresa || e.empresa_detectada || "Empresa evaluada";
  const lvl = levelOf(e.indice);
  const sc = {social:e.dimensiones.social.nota, ambiental:e.dimensiones.ambiental.nota, economico:e.dimensiones.economico.nota};
  const gcol = e.indice>=60?"var(--green)":e.indice>=40?"var(--amber)":"var(--red)";
  const sem = e.indice>=60?{c:"var(--green)",t:"Verde"}:e.indice>=40?{c:"var(--amber)",t:"Amarillo"}:{c:"var(--red)",t:"Rojo"};
  const rv = e.redes_vs_brief;
  const bn = e.briefing_nico;

  const dimBlock = k=>{
    const d = e.dimensiones[k];
    return '<div class="dimblock">'+
      '<div class="dim-top"><span class="dim-tag" style="background:'+DIMS[k].hex+'"></span>'+
        '<span class="dim-name">'+DIMS[k].name+'</span><span class="dim-score">'+d.nota+' / 100</span></div>'+
      '<div class="dim-track"><div class="dim-fill" data-w="'+d.nota+'" style="background:'+DIMS[k].hex+'"></div><div class="dim-mark"></div></div>'+
      '<div class="dim-body">'+esc(d.resumen)+'</div>'+
      '<div class="dim-cols">'+
        '<div class="dim-col pro"><h5>Sostiene la nota</h5><ul>'+
          ((d.fortalezas||[]).map(f=>'<li>'+esc(f)+'</li>').join("") || '<li style="list-style:none;padding:0;color:var(--faint)">Sin evidencia destacable.</li>')+'</ul></div>'+
        '<div class="dim-col con"><h5>Lo que falta</h5><ul>'+
          ((d.vacios||[]).map(v=>'<li>'+esc(v)+'</li>').join("") || '<li style="list-style:none;padding:0;color:var(--faint)">Sin vacíos mayores.</li>')+'</ul></div>'+
      '</div></div>';
  };

  screens.res.innerHTML =
  '<div class="rhead"><h2>'+esc(emp)+'</h2><span class="co">'+esc(e.tipo_documento||"documento")+' · confianza '+esc(e.confianza||"—")+'</span></div>'+
  '<p class="rsub">Evaluado por '+esc(meta.analista||"MQI")+' · '+new Date().toLocaleDateString("es-EC",{day:"numeric",month:"long",year:"numeric"})+'</p>'+

  '<div class="score-card">'+
    '<div class="score-row"><span class="score-num" style="color:'+gcol+'">'+e.indice+'</span>'+
      '<span class="score-den">/ 100<b>índice de triple impacto</b></span>'+
      '<div class="level"><span>Nivel</span><b>'+lvl.name+'</b></div></div>'+
    '<div class="gauge"><div class="gauge-track"><div class="gauge-fill" id="gaugeFill" style="background:'+gcol+'"></div></div>'+
      '<div class="gauge-legal"><b>mínimo legal</b></div>'+
      '<div class="gauge-mod"><b>memoria madura</b></div>'+
      '<div class="gauge-ticks"><span>0</span><span>100</span></div></div>'+
    '<div class="verdict-line">'+esc(e.veredicto)+'</div>'+
    '<div class="reco-line"><span class="lt"><span class="light" style="background:'+sem.c+'"></span>Semáforo '+sem.t+' · ¿Recomendada para MQI?: <b>'+esc(e.recomendada||"—")+'</b></span></div>'+
  '</div>'+

  '<div class="section"><h3>Por dimensión</h3>'+
    '<p class="sub">Misma vara en las tres: 40 = solo cumple la ley. La línea punteada marca ese piso.</p>'+
    dimBlock("social")+dimBlock("ambiental")+dimBlock("economico")+
    '<div class="radar-wrap">'+radarSVG(sc)+'</div>'+
    '<p class="radar-note">línea punteada interior = mínimo legal (40)</p>'+
  '</div>'+

  ((e.alertas||[]).length ?
  '<div class="section"><h3>Señales de alerta</h3>'+
    '<p class="sub">Puntos donde el brief promete más de lo que prueba, o deja áreas sin cubrir.</p>'+
    '<div class="flags">'+e.alertas.map(a=>
      '<div class="flag '+(a.nivel==="alta"?"high":"")+'"><div class="fi">'+(a.nivel==="alta"?"Alta":"Media")+'</div><p>'+esc(a.texto)+'</p></div>').join("")+
    '</div></div>' : '')+

  '<div class="section"><h3>Brief vs redes</h3>'+
    '<p class="sub">Material de redes: '+esc(rv.material_redes)+'. Lo que coincide, lo que no, y qué falta verificar.</p>'+
    '<div class="dim-body" style="margin-bottom:14px">'+esc(rv.resumen)+'</div>'+
    '<div class="dim-cols">'+
      '<div class="dim-col pro"><h5>Alineaciones</h5><ul>'+
        ((rv.alineaciones||[]).map(x=>'<li>'+esc(x)+'</li>').join("") || '<li style="list-style:none;padding:0;color:var(--faint)">Sin notas</li>')+'</ul></div>'+
      '<div class="dim-col con"><h5>Contradicciones</h5><ul>'+
        ((rv.contradicciones||[]).map(x=>'<li>'+esc(x)+'</li>').join("") || '<li style="list-style:none;padding:0;color:var(--faint)">Sin notas</li>')+'</ul></div>'+
    '</div>'+
    ((rv.solo_storytelling||[]).length ? '<div class="flags" style="margin-top:14px">'+rv.solo_storytelling.map(x=>
      '<div class="flag"><div class="fi">Relato</div><p>'+esc(x)+'</p></div>').join("")+'</div>' : '')+
    ((rv.verificar||[]).length ? '<div class="recs" style="margin-top:14px">'+rv.verificar.map((x,i)=>
      '<div class="rec"><div class="n">'+String(i+1).padStart(2,"0")+'</div><div class="b"><p>'+esc(x)+'</p></div></div>').join("")+'</div>' : '')+
  '</div>'+

  '<div class="section"><h3>Briefing para Nico</h3>'+
    '<p class="sub">Documento listo para descargar y pasar al host. Semáforo basado en evidencia observable.</p>'+
    '<div class="fgrid" style="margin-bottom:16px">'+
      '<div class="fcell" style="background:var(--paper);border-color:var(--line)"><label style="color:var(--faint)">Empresa</label><div class="v" style="color:var(--ink);font-size:14px">'+esc(bn.ficha_rapida.empresa||emp)+'</div></div>'+
      '<div class="fcell" style="background:var(--paper);border-color:var(--line)"><label style="color:var(--faint)">Fundador(a)</label><div class="v" style="color:var(--ink);font-size:14px">'+esc(bn.ficha_rapida.fundador)+'</div></div>'+
      '<div class="fcell" style="background:var(--paper);border-color:var(--line)"><label style="color:var(--faint)">Sector</label><div class="v" style="color:var(--ink);font-size:14px">'+esc(bn.ficha_rapida.sector||"—")+'</div></div>'+
      '<div class="fcell" style="background:var(--paper);border-color:var(--line)"><label style="color:var(--faint)">Planeta</label><div class="v semaforo" style="color:var(--ink)"><i class="light" style="background:'+lightHex(bn.semaforo.planeta)+'"></i>'+lightEmoji(bn.semaforo.planeta)+'</div></div>'+
      '<div class="fcell" style="background:var(--paper);border-color:var(--line)"><label style="color:var(--faint)">Personas</label><div class="v semaforo" style="color:var(--ink)"><i class="light" style="background:'+lightHex(bn.semaforo.personas)+'"></i>'+lightEmoji(bn.semaforo.personas)+'</div></div>'+
      '<div class="fcell" style="background:var(--paper);border-color:var(--line)"><label style="color:var(--faint)">Utilidad</label><div class="v semaforo" style="color:var(--ink)"><i class="light" style="background:'+lightHex(bn.semaforo.utilidad)+'"></i>'+lightEmoji(bn.semaforo.utilidad)+'</div></div>'+
    '</div>'+
    '<div class="dim-body" style="margin-bottom:12px"><b>Justificación:</b> '+esc(bn.semaforo.justificacion||"—")+'</div>'+
    '<div class="dim-body" style="margin-bottom:12px"><b>Gancho:</b> '+esc(bn.gancho_entrevista||"—")+'</div>'+
    '<div class="dim-body" style="margin-bottom:12px"><b>Fit MQI:</b> '+esc(bn.fit_marca||"—")+'</div>'+
    '<div class="dim-body" style="margin-bottom:16px"><b>Recomendación:</b> '+esc(bn.recomendacion_final||"—")+'</div>'+
    '<div class="recs">'+(bn.preguntas_fuertes||[]).map((q,i)=>
      '<div class="rec"><div class="n">'+String(i+1).padStart(2,"0")+'</div><div class="b"><p>'+esc(q)+'</p></div></div>').join("")+
    '</div>'+
    '<div class="copyrow" style="margin-top:18px">'+
      '<button class="solid" id="downloadNico" type="button">Descargar briefing Nico</button>'+
      '<button class="outline" id="copyNico" type="button" style="border-color:var(--line);color:var(--ink)">Copiar briefing</button>'+
      '<span class="copied" id="copiedNico" style="color:var(--green)">Copiado</span>'+
    '</div>'+
  '</div>'+

  '<div class="section"><h3>Cómo subir la nota</h3>'+
    '<p class="sub">Acciones concretas que moverían a esta empresa por encima del mínimo legal.</p>'+
    '<div class="recs">'+(e.recomendaciones||[]).map((r,i)=>
      '<div class="rec"><div class="n">'+String(i+1).padStart(2,"0")+'</div><div class="b"><p>'+esc(r)+'</p></div></div>').join("")+
    '</div></div>'+

  ((e.citas||[]).length ?
  '<div class="section"><h3>Del propio documento</h3>'+
    '<p class="sub">Frases que el evaluador usó como evidencia, con su lectura.</p>'+
    '<div class="quotes">'+e.citas.map(c=>
      '<div class="quote"><div class="qt">“'+esc(c.texto)+'”</div><div class="qm">'+esc(c.lectura)+'</div></div>').join("")+
    '</div></div>' : '')+

  '<div class="ficha"><h3>Ficha interna MQI</h3><p class="sub">Lista para archivar o compartir con el equipo comercial.</p>'+
    '<div class="fgrid">'+
      '<div class="fcell"><label>Índice</label><div class="v">'+e.indice+' / 100</div></div>'+
      '<div class="fcell wide"><label>Nivel</label><div class="v">'+lvl.name+'</div></div>'+
      '<div class="fcell"><label>Social</label><div class="v">'+sc.social+'</div></div>'+
      '<div class="fcell"><label>Ambiental</label><div class="v">'+sc.ambiental+'</div></div>'+
      '<div class="fcell"><label>Econ./Gob.</label><div class="v">'+sc.economico+'</div></div>'+
      '<div class="fcell"><label>Semáforo</label><div class="v semaforo"><i class="light" style="background:'+sem.c+'"></i>'+sem.t+'</div></div>'+
      '<div class="fcell wide"><label>¿Recomendada?</label><div class="v">'+esc(e.recomendada||"—")+'</div></div>'+
      '<div class="fcell full"><label>Observaciones del analista</label><textarea id="obsBox" placeholder="Contexto del cliente, riesgos reputacionales, condiciones para aceptar el proyecto…"></textarea></div>'+
    '</div>'+
    '<div class="copyrow">'+
      '<button class="solid" id="copyReport">Copiar informe</button>'+
      '<button class="outline" id="downloadReport">Descargar evaluación .txt</button>'+
      '<button class="outline" id="downloadNico2">Descargar briefing Nico</button>'+
      '<span class="copied" id="copiedMsg">Copiado</span>'+
    '</div>'+
  '</div>'+

  '<div class="footer">Evaluador de Briefs · Triple Impact Check · Marcas que Impactan. Diagnóstico de madurez asistido por IA, no constituye una certificación.<br><br><button id="restartBottom">Evaluar otro brief</button></div>';

  requestAnimationFrame(()=>{
    $("gaugeFill").style.width = e.indice + "%";
    document.querySelectorAll(".dim-fill").forEach(f=> f.style.width = f.dataset.w + "%");
  });

  const slug = ((meta.empresa||e.empresa_detectada||"brief").replace(/[^\w\-]+/g,"_"));
  const downloadNico = ()=>{
    if(!window.jspdf){
      alert("No se pudo cargar el generador de PDF. Se descargará el briefing en .txt.");
      return downloadBlob(new Blob([buildNicoReport()],{type:"text/plain;charset=utf-8"}), "BriefingNico-"+slug+".txt");
    }
    buildNicoPdf().save("BriefingNico-"+slug+".pdf");
  };

  $("obsBox").value = meta.nota;
  $("obsBox").oninput = ev=> meta.nota = ev.target.value;
  $("copyReport").onclick = ()=> copyText(buildReport(),"copiedMsg");
  $("downloadReport").onclick = ()=> downloadBlob(new Blob([buildReport()],{type:"text/plain;charset=utf-8"}),
    "EvaluacionTripleImpacto-" + slug + ".txt");
  $("downloadNico").onclick = downloadNico;
  $("downloadNico2").onclick = downloadNico;
  $("copyNico").onclick = ()=> copyText(buildNicoReport(),"copiedNico");
  $("restartBottom").onclick = ()=> resetAll();
}

function downloadBlob(blob,name){
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}
function copyText(text,msgId){
  const done=()=>{const m=$(msgId);m.classList.add("show");setTimeout(()=>m.classList.remove("show"),2200);};
  if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(()=>fb(text,done));
  else fb(text,done);
}
function fb(text,done){
  const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
  document.body.appendChild(ta); ta.select();
  try{document.execCommand("copy");done();}catch(e){alert("No se pudo copiar. Usa descargar.");}
  document.body.removeChild(ta);
}
function resetAll(){
  picked=null; extractedText=""; evaluation=null; meta.nota=""; meta.redes=""; meta.redesUrls="";
  $("inEmpresa").value=""; $("inAnalista").value=""; $("pasteBox").value=""; $("pasteBox").disabled=false;
  $("inRedesUrls").value=""; $("redesBox").value="";
  renderPill(); refreshBtn(); show("intro");
}
$("restartTop").onclick = resetAll;
