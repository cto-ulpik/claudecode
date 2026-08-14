import { Link, Outlet } from "react-router-dom";
import { ThemeFab } from "./ThemeFab";
import { LogoutButton } from "./LogoutButton";
import { getCachedUser } from "../auth/session";
import "../styles/app-shell.css";

export function AppShell() {
  const user = getCachedUser();

  return (
    <>
      <div className="app-shell__actions" aria-label="Acciones de sesión y tema">
        {user ? (
          <span className="app-shell__user" title={user.email}>
            {user.name}
          </span>
        ) : null}
        <Link className="app-shell__link" to="/cuenta/contrasena">
          Contraseña
        </Link>
        <LogoutButton />
        <ThemeFab />
      </div>
      <Outlet />
    </>
  );
}
