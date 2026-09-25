/** Auditor de Trámites SENADI — pantalla completa (requiere sesión). */
export function UlpikAuditorPage() {
  return (
    <iframe
      title="Auditor de Trámites SENADI · Ulpik"
      src="/auditor/index.html"
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
