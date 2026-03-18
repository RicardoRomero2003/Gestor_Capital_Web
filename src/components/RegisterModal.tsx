import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { registerWithSupabase } from "../api/authApi";
import type { StatusKind } from "../auth/types";
import "./RegisterModal.css";

type RegisterModalProps = {
  onClose: () => void;
  onRegistered: (usuario: string) => void;
};

export function RegisterModal({ onClose, onRegistered }: RegisterModalProps) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!usuario.trim() || !password) {
      setStatusKind("error");
      setStatus("Completa usuario y contrasena para registrarte.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusKind("idle");
      setStatus("");

      await registerWithSupabase(usuario, password);
      setStatusKind("success");
      setStatus("Usuario registrado correctamente.");
      onRegistered(usuario.trim());
    } catch (error) {
      setStatusKind("error");
      setStatus(error instanceof Error ? error.message : "No se pudo registrar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-backdrop" role="presentation" onClick={onClose}>
      <motion.section
        className="register-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Formulario de registro"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="register-header">
          <h2>Registrarme</h2>
          <button type="button" className="register-close" onClick={onClose} aria-label="Cerrar registro">
            x
          </button>
        </header>

        <form className="register-form" onSubmit={onSubmit}>
          <label htmlFor="register-usuario">Usuario</label>
          <input
            id="register-usuario"
            type="text"
            autoComplete="username"
            placeholder="Tu usuario"
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
          />

          <label htmlFor="register-password">Contrasena</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
            type="submit"
            className="register-submit"
            disabled={isSubmitting}
          >
            Registrarme
          </motion.button>

          <p className={`register-status ${statusKind}`}>{status}</p>
        </form>
      </motion.section>
    </div>
  );
}
