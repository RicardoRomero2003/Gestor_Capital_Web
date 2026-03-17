import type { Theme } from "../auth/types";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button type="button" className="mode-toggle" onClick={onToggle}>
      {theme === "light" ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}
