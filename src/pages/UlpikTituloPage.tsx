import { useEffect } from "react";

/** Redirige a la página estática (sin iframe ni login de la SPA). */
export function UlpikTituloPage() {
  useEffect(() => {
    const target = "/titulo/";
    if (window.location.pathname !== "/titulo/" && !window.location.pathname.endsWith("/titulo/index.html")) {
      window.location.replace(target);
    }
  }, []);

  return null;
}
