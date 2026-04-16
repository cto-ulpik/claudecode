import { useNavigate } from "react-router-dom";
import { logoutSession } from "../auth/session";

export function LogoutButton() {
  const navigate = useNavigate();

  function onLogout() {
    logoutSession();
    navigate("/login", { replace: true });
  }

  return (
    <button type="button" className="logout-btn" onClick={onLogout}>
      Salir
    </button>
  );
}
