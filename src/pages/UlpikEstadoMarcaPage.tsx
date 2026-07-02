/** Página pública a pantalla completa (sin login de claudecode). */
export function UlpikEstadoMarcaPage() {
  return (
    <iframe
      title="Ulpik · Estado de tu marca"
      src="/estado-marca/index.html"
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
