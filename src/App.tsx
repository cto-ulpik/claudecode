import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AgentsPage } from "./pages/AgentsPage";
import { KpiCtoPage } from "./pages/KpiCtoPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/agentes" element={<AgentsPage />} />
      <Route path="/agentes/" element={<AgentsPage />} />
      <Route path="/kpi-cto" element={<KpiCtoPage />} />
      <Route path="/kpi-cto/" element={<KpiCtoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
