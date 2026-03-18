import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { loginWithSupabase } from "../api/authApi";
import { getInitialTheme } from "../auth/theme";
import type { AuthenticatedUser, StatusKind, Theme } from "../auth/types";
import { RegisterModal } from "../components/RegisterModal";
import "./LoginScreen.css";

type LoginScreenProps = {
  onLoginSuccess: (user: AuthenticatedUser) => void;
};

const LOGIN_HINT_KEY = "capify_login_hint";

type LoginHint = {
  usuario: string;
  password: string;
  remember: boolean;
};

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [theme] = useState<Theme>(getInitialTheme);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOGIN_HINT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LoginHint;
      if (!parsed.remember) return;
      setUsuario(parsed.usuario ?? "");
      setPassword(parsed.password ?? "");
      setRemember(true);
    } catch {
      // Si el formato del storage es invalido, se ignora en silencio.
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!usuario || !password) {
      setStatusKind("error");
      setStatus("Completa usuario y contrasena para continuar.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusKind("idle");
      setStatus("");

      const sessionUser = await loginWithSupabase(usuario, password);
      const nombre = sessionUser.usuario || getDisplayNameFromIdentifier(usuario);
      onLoginSuccess({
        userId: sessionUser.user_id,
        uid: sessionUser.uid,
        correo: sessionUser.correo,
        nombre,
      });

      if (remember) {
        const hint: LoginHint = { usuario, password, remember: true };
        window.localStorage.setItem(LOGIN_HINT_KEY, JSON.stringify(hint));
      } else {
        window.localStorage.removeItem(LOGIN_HINT_KEY);
      }

      setStatusKind("success");
      setStatus("Login correcto.");
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
          <img className="login-logo" src="/assets/capify-logo.png" alt="Capify" />
        </header>

        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            placeholder="Tu usuario"
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
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

      <button
        type="button"
        className="register-floating-button"
        onClick={() => setIsRegisterOpen(true)}
      >
        Registrarme
      </button>

      {isRegisterOpen ? (
        <RegisterModal
          onClose={() => setIsRegisterOpen(false)}
          onRegistered={(registeredUser) => {
            setUsuario(registeredUser);
            setPassword("");
            setStatusKind("success");
            setStatus("Registro completado. Inicia sesion con tu nuevo usuario.");
            setIsRegisterOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

function getDisplayNameFromIdentifier(identifier: string): string {
  const raw = identifier.split("@")[0] ?? identifier;
  if (!raw.trim()) {
    return "Usuario";
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
