import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../auth/api";
import { ThemeFab } from "../components/ThemeFab";
import "../styles/login.css";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token")?.trim() || "", [params]);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    setError("");
    setOk("");
    if (!token) {
      setError("Falta el enlace de renovación. Solicita uno nuevo.");
      return;
    }
    setLoading(true);
    try {
      const data = await resetPassword(token);
      setOk(data.message || "Contraseña restablecida.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restablecer la contraseña");
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
        <h1 className="login-card__title">Restablecer contraseña</h1>
        <p className="login-card__lede">
          Tu contraseña se restablecerá a la de por defecto. Tus otras sesiones se cerrarán.
        </p>
        <div className="login-form">
          {error ? <p className="login-form__error">{error}</p> : null}
          {ok ? <p className="login-form__ok">{ok}</p> : null}
          <button
            type="button"
            className="login-form__submit"
            onClick={onConfirm}
            disabled={loading || !token || !!ok}
          >
            {loading ? "Restableciendo…" : "Restablecer contraseña"}
          </button>
        </div>
        <p className="login-card__links">
          <Link to="/olvide-contrasena">Solicitar otro enlace</Link>
          {" · "}
          <Link to="/login">Ir al acceso</Link>
        </p>
      </div>
    </div>
  );
}
