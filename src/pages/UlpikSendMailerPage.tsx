/** Herramienta pública a pantalla completa para correos de avance de marcas. */
export function UlpikSendMailerPage() {
  return (
    <iframe
      title="Ulpik · Correos por etapa"
      src="/send-mailer/index.html"
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
