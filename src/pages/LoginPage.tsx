import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { APP_LOGIN_PASS, APP_LOGIN_USER } from "../auth/config";
import { isAuthenticated, loginSession } from "../auth/session";
import { ThemeFab } from "../components/ThemeFab";
import "../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (user.trim() === APP_LOGIN_USER && pass === APP_LOGIN_PASS) {
      loginSession();
      navigate(fromPath && fromPath !== "/login" ? fromPath : "/", { replace: true });
      return;
    }
    setError("Usuario o contraseña incorrectos.");
  }

  return (
    <div className="login-page">
      <div className="login-page__fab">
        <ThemeFab />
      </div>
      <div className="login-card">
        <h1 className="login-card__title">Acceso</h1>
        <p className="login-card__lede">Introduce credenciales para continuar.</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="login-user">Usuario</label>
          <input
            id="login-user"
            name="user"
            type="text"
            autoComplete="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            required
          />
          <label htmlFor="login-pass">Contraseña</label>
          <input
            id="login-pass"
            name="password"
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
          {error ? <p className="login-form__error">{error}</p> : null}
          <button type="submit" className="login-form__submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
