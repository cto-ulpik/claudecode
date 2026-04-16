import { useTheme } from "../context/ThemeContext";
import "../styles/theme-fab.css";

export function ThemeFab() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-fab"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <span className="theme-fab__icon" aria-hidden="true">
        {isDark ? "☀" : "☾"}
      </span>
      <span className="theme-fab__text">{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}
