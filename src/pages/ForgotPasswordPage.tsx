import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../auth/api";
import { ThemeFab } from "../components/ThemeFab";
import "../styles/login.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOk("");
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setOk(data.message || "Si el correo está autorizado, recibirás un enlace.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el enlace");
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
        <h1 className="login-card__title">Renovar contraseña</h1>
        <p className="login-card__lede">
          Te enviaremos un enlace a tu correo Ulpik para elegir una nueva contraseña.
        </p>
        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="forgot-email">Correo</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <p className="login-form__error">{error}</p> : null}
          {ok ? <p className="login-form__ok">{ok}</p> : null}
          <button type="submit" className="login-form__submit" disabled={loading}>
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
        <p className="login-card__links">
          <Link to="/login">Volver al acceso</Link>
        </p>
      </div>
    </div>
  );
}
