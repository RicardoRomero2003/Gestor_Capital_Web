import { useEffect, useState } from "react";
import { getCurrentSessionUser, logoutSupabaseSession } from "./api/authApi";
import type { AuthenticatedUser } from "./auth/types";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";

export default function App() {
  const [activeUser, setActiveUser] = useState<AuthenticatedUser | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        const sessionUser = await getCurrentSessionUser();
        if (!active || !sessionUser) return;

        setActiveUser({
          userId: sessionUser.user_id,
          uid: sessionUser.uid,
          correo: sessionUser.correo,
          nombre: sessionUser.usuario || (sessionUser.correo.split("@")[0] ?? "Usuario"),
        });
      } finally {
        if (active) setIsBooting(false);
      }
    };

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, []);

  if (isBooting) {
    return null;
  }

  if (activeUser) {
    return (
      <HomeScreen
        user={activeUser}
        onLogout={() => {
          setActiveUser(null);
          void logoutSupabaseSession();
        }}
      />
    );
  }

  return <LoginScreen onLoginSuccess={setActiveUser} />;
}
