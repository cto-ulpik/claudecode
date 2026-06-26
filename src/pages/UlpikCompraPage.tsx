/** Página pública a pantalla completa (sin login de claudecode). */
export function UlpikCompraPage() {
  return (
    <iframe
      title="Ulpik · Proceso de compra"
      src="/compra/index.html"
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
