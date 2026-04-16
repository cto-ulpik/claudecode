import { Outlet } from "react-router-dom";
import { ThemeFab } from "./ThemeFab";
import { LogoutButton } from "./LogoutButton";
import "../styles/app-shell.css";

export function AppShell() {
  return (
    <>
      <div className="app-shell__actions" aria-label="Acciones de sesión y tema">
        <LogoutButton />
        <ThemeFab />
      </div>
      <Outlet />
    </>
  );
}
