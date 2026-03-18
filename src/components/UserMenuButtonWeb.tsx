import { useMemo, useState } from "react";
import "./UserMenuButtonWeb.css";
import type { AuthenticatedUser } from "../auth/types";

type UserMenuButtonWebProps = {
  user: AuthenticatedUser;
  onOpenSettings: () => void;
  onLogout: () => void;
};

export function UserMenuButtonWeb({ user, onOpenSettings, onLogout }: UserMenuButtonWebProps) {
  const [isOpen, setIsOpen] = useState(false);

  const avatarLetter = useMemo(() => (user.nombre[0] ?? "U").toUpperCase(), [user.nombre]);

  return (
    <>
      <button
        type="button"
        className="user-menu-web-avatar"
        aria-label="Abrir menu de usuario"
        onClick={() => setIsOpen((value) => !value)}
      >
        {avatarLetter}
      </button>

      {isOpen ? (
        <div className="user-menu-web-overlay" role="presentation" onClick={() => setIsOpen(false)}>
          <div className="user-menu-web-panel" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="user-menu-web-item"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
            >
              Configuracion
            </button>
            <button
              type="button"
              className="user-menu-web-item"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

