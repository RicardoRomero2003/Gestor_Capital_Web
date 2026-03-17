import type { AuthenticatedUser } from "../auth/types";
import "./UserCard.css";

type UserCardProps = {
  user: AuthenticatedUser;
  onLogout: () => void;
  onOpenSettings: () => void;
};

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23171717'/%3E%3Ccircle cx='60' cy='45' r='22' fill='%23f5f5f5'/%3E%3Cpath d='M20 103c0-22 18-34 40-34s40 12 40 34' fill='%23f5f5f5'/%3E%3C/svg%3E";

export function UserCard({ user, onLogout, onOpenSettings }: UserCardProps) {
  return (
    <aside className="user-card">
      <button type="button" className="settings-button" onClick={onOpenSettings}>
        Configuracion
      </button>
      <img className="user-avatar" src={DEFAULT_AVATAR} alt={`Avatar de ${user.nombre}`} />
      <div className="user-meta">
        <p className="user-label">Usuario activo</p>
        <p className="user-name">{user.nombre}</p>
      </div>
      <button type="button" className="logout-button" onClick={onLogout}>
        Cerrar sesion
      </button>
    </aside>
  );
}
