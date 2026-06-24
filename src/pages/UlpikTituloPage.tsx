/** Página pública a pantalla completa (sin login de claudecode). */
export function UlpikTituloPage() {
  return (
    <iframe
      title="Ulpik · Envío de Título"
      src="/titulo/index.html"
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
