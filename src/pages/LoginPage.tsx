import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { login } from "../auth/api";
import { getCachedUser, refreshAuth, setCachedSession } from "../auth/session";
import { ThemeFab } from "../components/ThemeFab";
import "../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(Boolean(getCachedUser()));

  useEffect(() => {
    let cancelled = false;
    refreshAuth()
      .then((user) => {
        if (!cancelled) setAuthed(Boolean(user));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checking && authed) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email.trim(), pass);
      setCachedSession(data.user, data.expiresAt);
      navigate(fromPath && fromPath !== "/login" ? fromPath : "/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__fab">
        <ThemeFab />
      </div>
      <div className="login-card">
        <h1 className="login-card__title">Acceso</h1>
        <p className="login-card__lede">Ingresa con tu correo Ulpik autorizado.</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <button type="submit" className="login-form__submit" disabled={loading || checking}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="login-card__links">
          <Link to="/olvide-contrasena">Olvidé mi contraseña</Link>
        </p>
      </div>
    </div>
  );
}
