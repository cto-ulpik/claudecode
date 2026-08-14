import { useNavigate } from "react-router-dom";
import { logout } from "../auth/api";
import { logoutSession } from "../auth/session";

export function LogoutButton() {
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    logoutSession();
    navigate("/login", { replace: true });
  }

  return (
    <button type="button" className="logout-btn" onClick={onLogout}>
      Salir
    </button>
  );
}
