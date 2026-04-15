import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AgentsPage } from "./pages/AgentsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/agentes" element={<AgentsPage />} />
      <Route path="/agentes/" element={<AgentsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
