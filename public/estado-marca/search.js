const LOGO_CDN = "https://imagedelivery.net/TyoaKSszdYgjylRv6IzBsw";

const $ = (id) => document.getElementById(id);
const modeDni = $("modeDni");
const modeUpk = $("modeUpk");
const queryEl = $("query");
const labelEl = $("fieldLabel");
const hintEl = $("fieldHint");
const form = $("searchForm");
const btn = $("btnSearch");
const statusEl = $("status");
const cardsEl = $("cards");

let mode = "dni"; // dni | upk

function setMode(next) {
  mode = next;
  modeDni.classList.toggle("on", mode === "dni");
  modeUpk.classList.toggle("on", mode === "upk");
  if (mode === "dni") {
    labelEl.textContent = "Número de CI o RUC";
    queryEl.placeholder = "Ej. 1717567109 o 1717567109001";
    hintEl.textContent = "Acepta CI (10 dígitos) o RUC (13). Si hay varias marcas, se muestran en tarjetas con su upk_code.";
  } else {
    labelEl.textContent = "Código UPK de tu marca";
    queryEl.placeholder = "Ej. UPK-8N66LY";
    hintEl.textContent = "Opción secundaria. El enlace de detalle siempre usa el código UPK generado.";
  }
  clearResults();
  queryEl.focus();
}

modeDni.addEventListener("click", () => setMode("dni"));
modeUpk.addEventListener("click", () => setMode("upk"));

function clearResults() {
  statusEl.hidden = true;
  statusEl.className = "status";
  statusEl.textContent = "";
  cardsEl.hidden = true;
  cardsEl.innerHTML = "";
}

function showStatus(msg, kind = "") {
  statusEl.hidden = false;
  statusEl.className = "status" + (kind ? " " + kind : "");
  statusEl.textContent = msg;
}

function normalizeUpk(raw) {
  const q = String(raw || "").trim().toUpperCase();
  if (!q) return "";
  return q.replace(/^UPK[-_\s]*/i, "");
}

function displayUpk(raw) {
  const core = normalizeUpk(raw);
  return core ? `UPK-${core}` : "";
}

function logoUrl(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `${LOGO_CDN}/${v}/public`;
}

function pickUpk(b) {
  if (!b || typeof b !== "object") return "";
  return String(
    b.upk_code ||
    b.upkCode ||
    b.upk ||
    (b.brand && (b.brand.upk_code || b.brand.upkCode)) ||
    ""
  ).trim();
}

function openTimeline(upkCode) {
  const code = displayUpk(upkCode) || normalizeUpk(upkCode);
  if (!code) {
    showStatus("Esta marca aún no tiene código UPK para abrir el detalle.", "err");
    return;
  }
  // Identificador canónico del detalle: código UPK
  const url = new URL("timeline.html", location.href);
  url.searchParams.set("upk", code);
  location.href = url.toString();
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" });
}

function renderCards(brands) {
  cardsEl.hidden = false;
  cardsEl.innerHTML = brands.map((b, i) => {
    const upk = pickUpk(b);
    const name = b.nameBrand || "Marca";
    const etapa = b.estado_marca || b.etapaTramite || b.estadoMarca || "En trámite";
    const start = formatDate(b.startDate || b.createAt || b.fechaSolicitud);
    const logo = logoUrl(b.logoUrl || b.idImage);
    const disabled = !normalizeUpk(upk);
    return `
      <button type="button" class="card" data-idx="${i}" ${disabled ? "disabled" : ""}>
        <div class="card-logo">${logo ? `<img src="${logo}" alt="">` : "UPK"}</div>
        <div>
          <h3>${escapeHtml(name)}</h3>
          <p class="meta">Inicio: ${escapeHtml(start)}${upk ? ` · ${escapeHtml(displayUpk(upk))}` : " · sin UPK"}</p>
          <span class="badge">${escapeHtml(etapa)}</span>
        </div>
        <span class="go">${disabled ? "Sin UPK" : "Ver →"}</span>
      </button>`;
  }).join("");

  cardsEl.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => {
      const brand = brands[Number(el.dataset.idx)];
      openTimeline(pickUpk(brand));
    });
  });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function searchByDni(dni) {
  // Enviar solo dígitos; el backend también prueba CI↔RUC
  const cleaned = String(dni || "").replace(/\D/g, "") || String(dni || "").trim();
  const res = await fetch(`/api/brands/dni/${encodeURIComponent(cleaned)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `No se pudo buscar (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : "Error al buscar por CI/RUC");
  }
  if (!Array.isArray(data)) {
    throw new Error("Respuesta inesperada del servidor");
  }
  return data;
}

async function searchByUpk(raw) {
  const code = normalizeUpk(raw);
  if (!code || code.length < 4) throw new Error("Ingresa un código UPK válido.");
  const res = await fetch(`/api/brand/upk/${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok || !data.brand) {
    throw new Error(data.message || "No se encontró una marca con ese código UPK");
  }
  return data.brand;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearResults();
  const q = queryEl.value.trim();
  if (!q) return;

  btn.disabled = true;
  showStatus("Buscando…");

  try {
    if (mode === "upk") {
      const brand = await searchByUpk(q);
      openTimeline(pickUpk(brand) || q);
      return;
    }

    const brands = await searchByDni(q);
    if (!brands.length) {
      showStatus("No se encontraron marcas con ese CI/RUC.", "err");
      return;
    }

    if (brands.length === 1) {
      const only = brands[0];
      const upk = pickUpk(only);
      if (!normalizeUpk(upk)) {
        showStatus("Se encontró 1 marca, pero la API no devolvió upk_code. Revisa el brands-manager desplegado.", "err");
        renderCards(brands);
        return;
      }
      showStatus("1 marca encontrada. Abriendo detalle…", "ok");
      openTimeline(upk);
      return;
    }

    showStatus(`${brands.length} marcas encontradas. Elige una tarjeta para ver el detalle (por UPK).`, "ok");
    renderCards(brands);
  } catch (err) {
    showStatus(err.message || String(err), "err");
  } finally {
    btn.disabled = false;
  }
});

// Si alguien abre index con ?upk=, ir directo al timeline
(() => {
  const params = new URLSearchParams(location.search);
  const upk = params.get("upk");
  if (upk) openTimeline(upk);
})();
