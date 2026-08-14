import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { refreshAuth } from "../auth/session";

export function RequireAuth() {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ok" | "no">("loading");

  useEffect(() => {
    let cancelled = false;
    refreshAuth().then((user) => {
      if (!cancelled) setStatus(user ? "ok" : "no");
    });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted, #888)" }}>
        Comprobando sesión…
      </div>
    );
  }

  if (status === "no") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
