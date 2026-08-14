import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "../auth/api";
import { logoutSession } from "../auth/session";
import "../styles/login.css";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOk("");
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const data = await changePassword(currentPassword, newPassword);
      logoutSession();
      setOk(data.message || "Contraseña actualizada.");
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home" style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 className="home__title" style={{ fontSize: "1.5rem" }}>
        Cambiar contraseña
      </h1>
      <p className="home__lede">
        Al guardar, se cerrarán todas tus sesiones activas (máx. 24 h) y deberás iniciar sesión de nuevo.
      </p>
      <form className="login-form" onSubmit={onSubmit} style={{ marginTop: "1.25rem" }}>
        <label htmlFor="cur-pass">Contraseña actual</label>
        <input
          id="cur-pass"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <label htmlFor="new-pass">Nueva contraseña</label>
        <input
          id="new-pass"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <label htmlFor="new-pass2">Confirmar nueva contraseña</label>
        <input
          id="new-pass2"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        {error ? <p className="login-form__error">{error}</p> : null}
        {ok ? <p className="login-form__ok">{ok}</p> : null}
        <button type="submit" className="login-form__submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar y cerrar sesiones"}
        </button>
      </form>
      <p className="login-card__links" style={{ marginTop: "1rem" }}>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
