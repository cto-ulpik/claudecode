import { useParams, useSearchParams } from "react-router-dom";

/** Página pública a pantalla completa (sin login de claudecode). */
export function UlpikEstadoMarcaPage() {
  const { upk: upkFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const upk = (upkFromPath || searchParams.get("upk") || "").trim();

  const src = upk
    ? `/estado-marca/index.html?upk=${encodeURIComponent(upk)}`
    : "/estado-marca/index.html";

  return (
    <iframe
      title="Ulpik · Estado de tu marca"
      src={src}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        display: "block",
      }}
    />
  );
}
