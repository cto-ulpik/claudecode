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
import { LoginPage } from "./pages/LoginPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/satisfaccion" element={<UlpikSatisfaccionPage />} />
      <Route path="/satisfaccion/" element={<UlpikSatisfaccionPage />} />
      <Route path="/titulo" element={<UlpikTituloPage />} />
      <Route path="/titulo/" element={<UlpikTituloPage />} />
      <Route path="/compra" element={<UlpikCompraPage />} />
      <Route path="/compra/" element={<UlpikCompraPage />} />
      <Route path="/pulso-equipo" element={<UlpikPulsoEquipoPage />} />
      <Route path="/pulso-equipo/" element={<UlpikPulsoEquipoPage />} />
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
          <Route path="/visualizador-dashboards" element={<DashboardViewerPage />} />
          <Route path="/visualizador-dashboards/" element={<DashboardViewerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
