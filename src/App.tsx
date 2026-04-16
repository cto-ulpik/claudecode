import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { HomePage } from "./pages/HomePage";
import { AgentsPage } from "./pages/AgentsPage";
import { KpiCtoPage } from "./pages/KpiCtoPage";
import { EmpathicEmailPage } from "./pages/EmpathicEmailPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/agentes" element={<AgentsPage />} />
          <Route path="/agentes/" element={<AgentsPage />} />
          <Route path="/kpi-cto" element={<KpiCtoPage />} />
          <Route path="/kpi-cto/" element={<KpiCtoPage />} />
          <Route path="/correo-empatico" element={<EmpathicEmailPage />} />
          <Route path="/correo-empatico/" element={<EmpathicEmailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
