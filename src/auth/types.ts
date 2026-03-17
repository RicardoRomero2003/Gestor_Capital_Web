export type Theme = "light" | "dark";
export type StatusKind = "idle" | "success" | "error";

export type AuthenticatedUser = {
  userId: number;
  uid: string;
  correo: string;
  nombre: string;
};

export type ApiSessionUser = {
  authenticated: boolean;
  uid: string;
  user_id: number;
  correo: string;
  usuario: string;
};
