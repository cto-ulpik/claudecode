/**
 * Genera agentes/js/agent-labels-es.js a partir de data.js
 * Heurística: quita prefijo de categoría del id y traduce palabras conocidas.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataPath = path.join(root, "agentes/js/data.js");
const outPath = path.join(root, "agentes/js/agent-labels-es.js");

const s = fs.readFileSync(dataPath, "utf8");
const json = s.replace(/^window\.AGENCY_DATA\s*=\s*/, "").replace(/;\s*$/, "");
const data = JSON.parse(json);

/** Palabras del slug (sin guiones), minúsculas → español */
const W = {
  ai: "IA",
  api: "API",
  seo: "SEO",
  ppc: "PPC",
  qa: "CA",
  sre: "SRE",
  mcp: "MCP",
  zk: "ZK",
  xr: "XR",
  ui: "IU",
  ux: "UX",
  cms: "CMS",
  gpu: "GPU",
  aws: "AWS",
  gcp: "GCP",
  rfp: "RFP",
  ga: "GA",
  aso: "ASO",
  prd: "PRD",
  mvp: "MVP",
  ceo: "CEO",
  nlp: "PLN",
  devops: "DevOps",
  feishu: "Feishu",
  wechat: "WeChat",
  weibo: "Weibo",
  zhihu: "Zhihu",
  douyin: "Douyin",
  kuaishou: "Kuaishou",
  xiaohongshu: "Xiaohongshu",
  bilibili: "Bilibili",
  baidu: "Baidu",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  reddit: "Reddit",
  twitter: "Twitter",
  podcast: "pódcast",
  macos: "macOS",
  visionos: "visionOS",
  jira: "Jira",
  git: "Git",
  email: "correo",
  solidity: "Solidity",
  filament: "Filament",
  engineering: "ingeniería",
  marketing: "mercadotecnia",
  design: "diseño",
  sales: "ventas",
  product: "producto",
  testing: "pruebas",
  support: "soporte",
  game: "juego",
  academic: "académico",
  specialized: "especializado",
  paid: "pago",
  media: "medios",
  project: "proyecto",
  management: "gestión",
  strategy: "estrategia",
  spatial: "espacial",
  computing: "computación",
  examples: "ejemplos",
  workflow: "flujo",
  developer: "desarrollador",
  developers: "desarrolladores",
  architect: "arquitecto",
  architecture: "arquitectura",
  engineer: "ingeniero",
  engineering: "ingeniería",
  specialist: "especialista",
  strategist: "estratega",
  optimizer: "optimizador",
  optimization: "optimización",
  automator: "automatizador",
  reviewer: "revisor",
  writer: "redactor",
  technical: "técnico",
  senior: "senior",
  backend: "back-end",
  frontend: "front-end",
  mobile: "móvil",
  app: "aplicación",
  builder: "constructor",
  security: "seguridad",
  data: "datos",
  database: "base de datos",
  embedded: "empotrado",
  firmware: "firmware",
  rapid: "rápido",
  prototyper: "prototipador",
  software: "software",
  smart: "inteligente",
  contract: "contrato",
  threat: "amenaza",
  detection: "detección",
  mini: "mini",
  program: "programa",
  brand: "marca",
  guardian: "guardián",
  image: "imagen",
  prompt: "prompt",
  inclusive: "inclusivo",
  visuals: "visuales",
  designer: "diseñador",
  researcher: "investigador",
  visual: "visual",
  storyteller: "narrador",
  whimsy: "encanto",
  injector: "inyector",
  citation: "citación",
  store: "tienda",
  content: "contenido",
  creator: "creador",
  growth: "crecimiento",
  hacker: "growth hacker",
  curator: "curador",
  engager: "engagement",
  coach: "coach",
  operator: "operador",
  social: "social",
  video: "vídeo",
  short: "corto",
  editing: "edición",
  livestream: "livestream",
  commerce: "comercio",
  private: "privado",
  domain: "dominio",
  community: "comunidad",
  cross: "cruzado",
  border: "frontera",
  ecommerce: "e-commerce",
  china: "China",
  market: "mercado",
  localization: "localización",
  book: "libro",
  co: "co",
  author: "autor",
  carousel: "carrusel",
  engine: "motor",
  account: "cuenta",
  deal: "negocio",
  discovery: "descubrimiento",
  outbound: "saliente",
  pipeline: "embudo",
  analyst: "analista",
  proposal: "propuesta",
  behavioral: "conductual",
  nudge: "empuje",
  feedback: "retroalimentación",
  synthesizer: "sintetizador",
  manager: "gestor",
  sprint: "sprint",
  prioritizer: "priorizador",
  trend: "tendencias",
  accessibility: "accesibilidad",
  auditor: "auditor",
  tester: "probador",
  evidence: "evidencia",
  collector: "recolector",
  performance: "rendimiento",
  benchmarker: "evaluador",
  reality: "realidad",
  checker: "verificador",
  results: "resultados",
  analyzer: "analizador",
  tool: "herramienta",
  evaluator: "evaluador",
  workflow: "flujo de trabajo",
  analytics: "analítica",
  reporter: "informes",
  executive: "ejecutivo",
  summary: "resumen",
  generator: "generador",
  finance: "finanzas",
  tracker: "seguimiento",
  infrastructure: "infraestructura",
  maintainer: "mantenedor",
  legal: "legal",
  compliance: "cumplimiento",
  responder: "respuesta",
  audio: "audio",
  level: "nivel",
  narrative: "narrativa",
  anthropologist: "antropólogo",
  geographer: "geógrafo",
  historian: "historiador",
  narratologist: "narratólogo",
  psychologist: "psicólogo",
  accounts: "cuentas",
  payable: "por pagar",
  agent: "agente",
  agentic: "agnético",
  identity: "identidad",
  trust: "confianza",
  agents: "agentes",
  orchestrator: "orquestador",
  automation: "automatización",
  governance: "gobernanza",
  blockchain: "cadena de bloques",
  corporate: "corporativo",
  training: "formación",
  consolidation: "consolidación",
  government: "gobierno",
  digital: "digital",
  presales: "preventa",
  consultant: "consultor",
  healthcare: "salud",
  graph: "grafo",
  recruitment: "reclutamiento",
  report: "informe",
  distribution: "distribución",
  extraction: "extracción",
  civil: "civil",
  cultural: "cultural",
  intelligence: "inteligencia",
  advocate: "advocacy",
  document: "documento",
  french: "francés",
  consulting: "consultoría",
  korean: "coreano",
  business: "negocios",
  navigator: "navegador",
  model: "modelo",
  salesforce: "Salesforce",
  study: "estudio",
  abroad: "en el extranjero",
  advisor: "asesor",
  supply: "suministro",
  chain: "cadena",
  steward: "administrador",
  creative: "creativo",
  programmatic: "programático",
  buyer: "comprador",
  search: "búsqueda",
  query: "consulta",
  tracking: "medición",
  experiment: "experimento",
  shepherd: "shepherd",
  studio: "estudio",
  operations: "operaciones",
  producer: "productor",
  nexus: "Nexus",
  quickstart: "inicio rápido",
  brief: "brief",
  metal: "Metal",
  terminal: "terminal",
  integration: "integración",
  immersive: "inmersivo",
  interface: "interfaz",
  cockpit: "cabina",
  interaction: "interacción",
  startup: "startup",
  landing: "landing",
  page: "página",
  chapter: "capítulo",
  memory: "memoria",
  with: "con",
  incident: "incidente",
  response: "respuesta",
  commander: "comandante",
  master: "maestro",
  code: "código",
  remediation: "remediación",
  autonomous: "autónomo",
  code: "código",
  reviewer: "revisor",
  email: "correo",
  intelligence: "inteligencia",
  wechat: "WeChat",
  optimization: "optimización",
  git: "Git",
  incident: "incidente",
  response: "respuesta",
  commander: "comandante",
  rapid: "rápido",
  prototyper: "prototipador",
  solidity: "Solidity",
  smart: "inteligente",
  contract: "contrato",
  wechat: "WeChat",
  mini: "mini",
  program: "programa",
};

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Quita prefijo de categoría del id si coincide */
function stripCategoryPrefix(id, catId) {
  const prefix = catId + "-";
  if (id.startsWith(prefix)) return id.slice(prefix.length);
  const catFirst = catId.split("-")[0];
  if (id.startsWith(catFirst + "-") && catId.includes("-")) {
    // game-development vs game-audio
    return id;
  }
  if (catId === "game-development") {
    if (id.startsWith("game-")) return id.slice(5);
    return id;
  }
  if (catId === "specialized") {
    if (id.startsWith("specialized-")) return id.slice(12);
    return id;
  }
  if (catId === "paid-media") {
    if (id.startsWith("paid-media-")) return id.slice(11);
    return id;
  }
  if (catId === "project-management") {
    if (id.startsWith("project-management-")) return id.slice(19);
    if (id.startsWith("project-manager-")) return id.slice(16);
    return id;
  }
  if (catId === "spatial-computing") return id;
  if (catId === "examples") {
    if (id.startsWith("workflow-")) return id.slice(9);
    if (id.startsWith("nexus-")) return id.slice(6);
    return id;
  }
  if (catId === "strategy") return id;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id.replace(new RegExp(`^${catFirst}-`), "");
}

/** Slug sin prefijo de categoría → título en español (evita listas tipo "Mercadotecnia — …" en el desplegable) */
const PHRASE_OVERRIDES = {
  "ai-citation-strategist": "Estratega de citación y visibilidad en IA (AEO)",
  "app-store-optimizer": "Optimizador ASO (App Store y Google Play)",
  "baidu-seo-specialist": "Especialista SEO en Baidu",
  "bilibili-content-strategist": "Estratega de contenido para Bilibili",
  "book-co-author": "Coautor de libros de mercadotecnia",
  "carousel-growth-engine": "Motor de crecimiento con carruseles",
  "china-ecommerce-operator": "Operador de e-commerce en China",
  "china-market-localization-strategist": "Estratega de localización para el mercado chino",
  "content-creator": "Creador de contenido",
  "cross-border-ecommerce": "Especialista en e-commerce transfronterizo",
  "douyin-strategist": "Estratega en Douyin",
  "growth-hacker": "Growth hacker",
  "instagram-curator": "Curador de Instagram",
  "kuaishou-strategist": "Estratega en Kuaishou",
  "linkedin-content-creator": "Creador de contenido en LinkedIn",
  "livestream-commerce-coach": "Coach de live commerce (compras en vivo)",
  "podcast-strategist": "Estratega de pódcast",
  "private-domain-operator": "Operador de tráfico en dominio privado",
  "reddit-community-builder": "Constructor de comunidad en Reddit",
  "seo-specialist": "Especialista SEO",
  "short-video-editing-coach": "Coach de edición de vídeo corto",
  "social-media-strategist": "Estratega de redes sociales",
  "tiktok-strategist": "Estratega en TikTok",
  "twitter-engager": "Especialista en engagement en X (Twitter)",
  "video-optimization-specialist": "Especialista en optimización de vídeo",
  "wechat-official-account": "Cuenta oficial de WeChat (OA)",
  "weibo-strategist": "Estratega en Weibo",
  "xiaohongshu-specialist": "Especialista en Xiaohongshu (RED)",
  "zhihu-strategist": "Estratega en Zhihu",
};

function translateSlug(rest) {
  if (PHRASE_OVERRIDES[rest]) return PHRASE_OVERRIDES[rest];
  const parts = rest.split("-").filter(Boolean);
  const out = parts.map((p) => {
    const low = p.toLowerCase();
    if (W[low]) return W[low];
    if (/^[A-Z]+$/.test(p) && p.length <= 5) return p;
    return capitalizeFirst(low);
  });
  return out.join(" ");
}

function labelForAgent(id, catId) {
  const rest = stripCategoryPrefix(id, catId);
  const t = translateSlug(rest);
  return t.replace(/\s+/g, " ").trim();
}

const map = {};
for (const [catId, cat] of Object.entries(data.categories)) {
  for (const a of cat.agents) {
    map[a.id] = labelForAgent(a.id, catId);
  }
}

const body = `// Generado por scripts/build-agent-labels-es.mjs — no editar a mano salvo excepciones
window.AGENT_LABELS_ES = ${JSON.stringify(map, null, 2)};
`;

fs.writeFileSync(outPath, body, "utf8");
console.log("Wrote", outPath, Object.keys(map).length, "labels");
