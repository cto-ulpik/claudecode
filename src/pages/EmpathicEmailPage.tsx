import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildEmpathicEmail,
  fullEmailText,
  type EmpathicEmailResult,
  type EmpathicTone,
} from "../lib/empathicEmail";
import "../styles/empathic-email.css";

const TONE_OPTIONS: { value: EmpathicTone; label: string }[] = [
  { value: "warm", label: "Cálido y cercano" },
  { value: "professional", label: "Profesional cercano" },
  { value: "formal", label: "Formal" },
];

export function EmpathicEmailPage() {
  const [advisorName, setAdvisorName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [situation, setSituation] = useState("");
  const [tone, setTone] = useState<EmpathicTone>("warm");
  const [includeSubject, setIncludeSubject] = useState(true);

  const [result, setResult] = useState<EmpathicEmailResult | null>(null);
  const [error, setError] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const generate = useCallback(() => {
    setError("");
    setCopyMsg("");
    const built = buildEmpathicEmail({
      advisorName,
      recipientName,
      relationship,
      situation,
      tone,
      includeSubject,
    });
    if (!built) {
      setResult(null);
      setError("Describe la situación o el mensaje que quieres transmitir (campo obligatorio).");
      return;
    }
    setResult(built);
  }, [advisorName, recipientName, relationship, situation, tone, includeSubject]);

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
          Rellena los datos como asesor y genera un borrador de correo con tono humano: reconoce el contexto, ordena el
          mensaje y deja un cierre claro. Revísalo siempre antes de enviarlo.
        </p>
      </header>

      <form
        className="emp-mail__form"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <div className="emp-mail__field">
          <label htmlFor="emp-advisor">Tu nombre (asesor)</label>
          <input
            id="emp-advisor"
            name="advisorName"
            type="text"
            autoComplete="name"
            placeholder="Ej. Laura Méndez"
            value={advisorName}
            onChange={(e) => setAdvisorName(e.target.value)}
          />
          <p className="emp-mail__hint">Firmará el correo; si lo dejas vacío verás un marcador para completarlo.</p>
        </div>

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
          <label htmlFor="emp-relation">Contexto o vínculo (opcional)</label>
          <input
            id="emp-relation"
            name="relationship"
            type="text"
            placeholder="Ej. nos acompañas en el plan desde enero"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          />
          <p className="emp-mail__hint">Una línea que ancle la relación sin ser larga.</p>
        </div>

        <div className="emp-mail__field">
          <label htmlFor="emp-situation">Situación o mensaje a transmitir</label>
          <textarea
            id="emp-situation"
            name="situation"
            required
            placeholder="Ej. Hubo un retraso en la documentación y queremos explicarte los pasos siguientes sin que te quedes con la incertidumbre…"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
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

        <div className="emp-mail__row">
          <label className="emp-mail__check">
            <input
              type="checkbox"
              checked={includeSubject}
              onChange={(e) => setIncludeSubject(e.target.checked)}
            />
            Incluir línea de asunto sugerida
          </label>
        </div>

        {error ? (
          <p className="emp-mail__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="emp-mail__actions">
          <button type="submit" className="emp-mail__btn emp-mail__btn--primary">
            Generar borrador
          </button>
        </div>
      </form>

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
