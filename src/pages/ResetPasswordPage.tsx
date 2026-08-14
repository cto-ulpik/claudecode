import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../auth/api";
import { ThemeFab } from "../components/ThemeFab";
import "../styles/login.css";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token")?.trim() || "", [params]);

  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOk("");
    if (!token) {
      setError("Falta el enlace de renovación. Solicita uno nuevo.");
      return;
    }
    if (pass.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (pass !== pass2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const data = await resetPassword(token, pass);
      setOk(data.message || "Contraseña actualizada.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la contraseña");
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
        <h1 className="login-card__title">Nueva contraseña</h1>
        <p className="login-card__lede">Elige una contraseña nueva. Tus otras sesiones se cerrarán.</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="reset-pass">Nueva contraseña</label>
          <input
            id="reset-pass"
            type="password"
            autoComplete="new-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            minLength={8}
          />
          <label htmlFor="reset-pass2">Confirmar contraseña</label>
          <input
            id="reset-pass2"
            type="password"
            autoComplete="new-password"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            required
            minLength={8}
          />
          {error ? <p className="login-form__error">{error}</p> : null}
          {ok ? <p className="login-form__ok">{ok}</p> : null}
          <button type="submit" className="login-form__submit" disabled={loading || !token}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
        <p className="login-card__links">
          <Link to="/olvide-contrasena">Solicitar otro enlace</Link>
          {" · "}
          <Link to="/login">Ir al acceso</Link>
        </p>
      </div>
    </div>
  );
}
