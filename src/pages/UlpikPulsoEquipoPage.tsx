/** Página pública a pantalla completa (sin login de claudecode). */
export function UlpikPulsoEquipoPage() {
  return (
    <iframe
      title="Ulpik · Pulso del Equipo"
      src="/pulso-equipo/index.html"
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
