import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { loginWithSupabase } from "../api/authApi";
import { getInitialTheme } from "../auth/theme";
import type { AuthenticatedUser, StatusKind, Theme } from "../auth/types";
import { ThemeToggle } from "../components/ThemeToggle";
import "./LoginScreen.css";

type LoginScreenProps = {
  onLoginSuccess: (user: AuthenticatedUser) => void;
};

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!correo || !password) {
      setStatusKind("error");
      setStatus("Completa correo y contrasena para continuar.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusKind("idle");
      setStatus("");

      const sessionUser = await loginWithSupabase(correo, password);
      const nombre = sessionUser.usuario || getDisplayNameFromCorreo(sessionUser.correo);
      onLoginSuccess({
        userId: sessionUser.user_id,
        uid: sessionUser.uid,
        correo: sessionUser.correo,
        nombre,
      });

      setStatusKind("success");
      setStatus(remember ? "Login correcto. Sesion recordada." : "Login correcto.");
      setPassword("");
    } catch (error) {
      setStatusKind("error");
      setStatus(error instanceof Error ? error.message : "Error inesperado al iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`login-page ${theme}`}>
      <motion.section
        className="login-shell"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <header className="login-header">
          <div>
            <p className="eyebrow">Gestor de Capital</p>
            <h1>Iniciar sesion</h1>
          </div>
          <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))} />
        </header>

        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="correo">Correo</label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
          />

          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <div className="login-actions">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Recordarme
            </label>
            <button type="button" className="text-button">
              Olvide mi contrasena
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            Entrar
          </motion.button>
          <p className={`status-text ${statusKind}`}>{status}</p>
        </form>
      </motion.section>
    </main>
  );
}

function getDisplayNameFromCorreo(correo: string): string {
  const raw = correo.split("@")[0] ?? correo;
  if (!raw.trim()) {
    return "Usuario";
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
