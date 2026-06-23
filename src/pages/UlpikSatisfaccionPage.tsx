/** Página pública a pantalla completa (sin login de claudecode). */
export function UlpikSatisfaccionPage() {
  return (
    <iframe
      title="Ulpik · Califica tu experiencia"
      src="/satisfaccion/index.html"
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
