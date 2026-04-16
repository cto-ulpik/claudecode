import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildEmpathicEmail,
  fullEmailText,
  type EmpathicEmailInput,
  type EmpathicEmailResult,
  type EmpathicTone,
} from "../lib/empathicEmail";
import { generateEmpathicEmailWithOpenAI } from "../lib/openaiEmpathicEmail";
import "../styles/empathic-email.css";

const TONE_OPTIONS: { value: EmpathicTone; label: string }[] = [
  { value: "warm", label: "Cálido y cercano" },
  { value: "professional", label: "Profesional cercano" },
  { value: "formal", label: "Formal" },
];

export function EmpathicEmailPage() {
  const [recipientName, setRecipientName] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<EmpathicTone>("warm");

  const [result, setResult] = useState<EmpathicEmailResult | null>(null);
  const [error, setError] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiNote, setApiNote] = useState("");

  const generate = useCallback(async () => {
    setError("");
    setCopyMsg("");
    setApiNote("");
    const input: EmpathicEmailInput = {
      recipientName,
      reason,
      message,
      tone,
    };
    if (!recipientName.trim() || !reason.trim() || !message.trim()) {
      setResult(null);
      setError("Completa destinatario, motivo y mensaje (campos obligatorios).");
      return;
    }

    setLoading(true);
    try {
      const ai = await generateEmpathicEmailWithOpenAI(input);
      setResult(ai);
    } catch {
      const built = buildEmpathicEmail(input);
      if (built) {
        setResult(built);
        setApiNote(
          "ChatGPT no respondió (clave, red o proxy). Revisa `OPENAI_API_KEY` en `.env.local` y ejecuta `npm run dev` o `npm run preview`. Se muestra el borrador local.",
        );
      } else {
        setResult(null);
        setError("No se pudo generar el borrador.");
      }
    } finally {
      setLoading(false);
    }
  }, [recipientName, reason, message, tone]);

  const copy = useCallback(async () => {
    if (!result) return;
    const text = fullEmailText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Copiado al portapapeles.");
    } catch {
      setCopyMsg("No se pudo copiar; selecciona el texto manualmente.");
    }
  }, [result]);

  return (
    <div className="emp-mail">
      <p className="emp-mail__back">
        <Link to="/">← Inicio</Link>
      </p>

      <header className="emp-mail__hero">
        <p className="emp-mail__tag">Comunicación</p>
        <h1>Correo empático</h1>
        <p>
          Rellena solo los datos clave y genera un correo empático con ChatGPT usando el prompt definido.
        </p>
        <p className="emp-mail__hero-note">
          Con <strong>OPENAI_API_KEY</strong> en <code>.env.local</code> (plantilla en <code>.env.example</code>) y{" "}
          <code>npm run dev</code> o <code>npm run preview</code>, el borrador lo redacta ChatGPT. Si la API falla, se
          usa el generador local.
        </p>
      </header>

      <form
        className="emp-mail__form"
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
      >
        <div className="emp-mail__field">
          <label htmlFor="emp-recipient">Nombre de quien recibe el correo</label>
          <input
            id="emp-recipient"
            name="recipientName"
            type="text"
            placeholder="Ej. Carlos"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <div className="emp-mail__field">
          <label htmlFor="emp-reason">Motivo del correo</label>
          <input id="emp-reason" name="reason" type="text" placeholder="Ej. Retraso en entrega" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="emp-mail__field">
          <label htmlFor="emp-message">Lo que se desea transmitir</label>
          <textarea
            id="emp-message"
            name="message"
            required
            placeholder="Ej. Queremos acompañarte y proponerte un plan claro para normalizar fechas."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="emp-mail__field">
          <label htmlFor="emp-tone">Tono del mensaje</label>
          <select id="emp-tone" name="tone" value={tone} onChange={(e) => setTone(e.target.value as EmpathicTone)}>
            {TONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="emp-mail__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="emp-mail__actions">
          <button type="submit" className="emp-mail__btn emp-mail__btn--primary" disabled={loading}>
            {loading ? "Generando…" : "Generar borrador"}
          </button>
        </div>
      </form>

      {apiNote ? (
        <p className="emp-mail__api-note" role="status">
          {apiNote}
        </p>
      ) : null}

      {result ? (
        <section className="emp-mail__output" aria-live="polite">
          <h2>Borrador</h2>
          {result.subject ? (
            <p className="emp-mail__subject">
              <strong>Asunto sugerido:</strong> {result.subject}
            </p>
          ) : null}
          <div className="emp-mail__body">{result.body}</div>
          <div className="emp-mail__actions">
            <button type="button" className="emp-mail__btn emp-mail__btn--primary" onClick={() => void copy()}>
              Copiar asunto + cuerpo
            </button>
          </div>
          {copyMsg ? (
            <p className="emp-mail__copy-msg" role="status">
              {copyMsg}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
