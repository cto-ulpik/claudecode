import { Link } from "react-router-dom";
import "../../css/home.css";

export function HomePage() {
  return (
    <div className="home">
      <header className="home__header">
        <p className="home__eyebrow">Proyecto claudecode</p>
        <h1 className="home__title">Herramientas para trabajar con IA</h1>
        <p className="home__lede">
          Punto de entrada a utilidades locales: genera briefs para agentes, enlaza con repos open source y amplia el
          ecosistema cuando quieras.
        </p>
      </header>

      <p className="home__section-title">Aplicaciones</p>
      <div className="home__grid" role="list">
        <Link className="home__card" to="/agentes" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ◈
          </span>
          <h2 className="home__card-title">Agentes Claude</h2>
          <p className="home__card-desc">
            Consulta y brief para 155+ agentes del repo Agency Agents: elige carpeta, agente y parametros para Claude
            Code, Cursor y mas.
          </p>
        </Link>

        <Link className="home__card" to="/kpi-cto" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ▲
          </span>
          <h2 className="home__card-title">KPI CTO</h2>
          <p className="home__card-desc">Panel tecnico con uptime del servidor y score SEO del sitio web.</p>
        </Link>

        <Link className="home__card" to="/correo-empatico" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ✉
          </span>
          <h2 className="home__card-title">Correo empático</h2>
          <p className="home__card-desc">
            Guía al asesor con unos datos y obtén un borrador de correo claro, cercano y listo para revisar.
          </p>
        </Link>

        <Link className="home__card" to="/send-mailer" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ◫
          </span>
          <h2 className="home__card-title">Send Mailer</h2>
          <p className="home__card-desc">
            Extrae datos de documentos SENADI y envía el correo correspondiente a cada etapa del registro.
          </p>
        </Link>

        <Link className="home__card" to="/visualizador-dashboards" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ▣
          </span>
          <h2 className="home__card-title">Visualizador de dashboards</h2>
          <p className="home__card-desc">
            Guarda HTML por nombre y categoría, filtra miniaturas y ábrelos en vista embebida a pantalla completa.
          </p>
        </Link>

        <a className="home__card" href="/satisfaccion" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ★
          </span>
          <h2 className="home__card-title">Satisfacción de clientes</h2>
          <p className="home__card-desc">
            Encuesta NPS pública para clientes. Acceso libre, sin contraseña.
          </p>
        </a>

        <a className="home__card" href="/pulso-equipo" role="listitem">
          <span className="home__card-icon" aria-hidden="true">
            ◉
          </span>
          <h2 className="home__card-title">Pulso del Equipo</h2>
          <p className="home__card-desc">
            Check-in semanal interno. Vista equipo sin contraseña; diagnóstico con PIN.
          </p>
        </a>
      </div>

      <footer className="home__footer">
        <p>
          <a href="https://github.com/cto-ulpik/claudecode" target="_blank" rel="noopener noreferrer">
            GitHub · claudecode
          </a>{" "}
          ·{" "}
          <a href="https://github.com/msitarzewski/agency-agents" target="_blank" rel="noopener noreferrer">
            agency-agents
          </a>
        </p>
      </footer>
    </div>
  );
}
