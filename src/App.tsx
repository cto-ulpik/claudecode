import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { HomePage } from "./pages/HomePage";
import { AgentsPage } from "./pages/AgentsPage";
import { KpiCtoPage } from "./pages/KpiCtoPage";
import { EmpathicEmailPage } from "./pages/EmpathicEmailPage";
import { DashboardViewerPage } from "./pages/DashboardViewerPage";
import { UlpikSatisfaccionPage } from "./pages/UlpikSatisfaccionPage";
import { UlpikTituloPage } from "./pages/UlpikTituloPage";
import { UlpikCompraPage } from "./pages/UlpikCompraPage";
import { UlpikPulsoEquipoPage } from "./pages/UlpikPulsoEquipoPage";
import { UlpikEstadoMarcaPage } from "./pages/UlpikEstadoMarcaPage";
import { UlpikSendMailerPage } from "./pages/UlpikSendMailerPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/olvide-contrasena" element={<ForgotPasswordPage />} />
      <Route path="/olvide-contrasena/" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      <Route path="/restablecer-contrasena/" element={<ResetPasswordPage />} />
      <Route path="/satisfaccion" element={<UlpikSatisfaccionPage />} />
      <Route path="/satisfaccion/" element={<UlpikSatisfaccionPage />} />
      <Route path="/titulo" element={<UlpikTituloPage />} />
      <Route path="/titulo/" element={<UlpikTituloPage />} />
      <Route path="/compra" element={<UlpikCompraPage />} />
      <Route path="/compra/" element={<UlpikCompraPage />} />
      <Route path="/pulso-equipo" element={<UlpikPulsoEquipoPage />} />
      <Route path="/pulso-equipo/" element={<UlpikPulsoEquipoPage />} />
      <Route path="/estado-marca/:upk" element={<UlpikEstadoMarcaPage />} />
      <Route path="/estado-marca/:upk/" element={<UlpikEstadoMarcaPage />} />
      <Route path="/estado-marca" element={<UlpikEstadoMarcaPage />} />
      <Route path="/estado-marca/" element={<UlpikEstadoMarcaPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/agentes" element={<AgentsPage />} />
          <Route path="/agentes/" element={<AgentsPage />} />
          <Route path="/kpi-cto" element={<KpiCtoPage />} />
          <Route path="/kpi-cto/" element={<KpiCtoPage />} />
          <Route path="/correo-empatico" element={<EmpathicEmailPage />} />
          <Route path="/correo-empatico/" element={<EmpathicEmailPage />} />
          <Route path="/send-mailer" element={<UlpikSendMailerPage />} />
          <Route path="/send-mailer/" element={<UlpikSendMailerPage />} />
          <Route path="/visualizador-dashboards" element={<DashboardViewerPage />} />
          <Route path="/visualizador-dashboards/" element={<DashboardViewerPage />} />
          <Route path="/cuenta/contrasena" element={<ChangePasswordPage />} />
          <Route path="/cuenta/contrasena/" element={<ChangePasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
