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
