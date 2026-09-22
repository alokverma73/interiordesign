import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "@/api/client";
import { useAuthStore } from "@/contexts/authStore";

interface Props {
  children: ReactNode;
  requireStaff?: boolean;
}

export default function ProtectedRoute({ children, requireStaff = false }: Props) {
  const { accessToken, user, setUser, logout } = useAuthStore();
  const [checking, setChecking] = useState(!user && !!accessToken);
  const location = useLocation();

  useEffect(() => {
    if (accessToken && !user) {
      api
        .get("/auth/me")
        .then((r) => setUser(r.data))
        .catch(() => logout())
        .finally(() => setChecking(false));
    }
  }, [accessToken, user, setUser, logout]);

  if (!accessToken) {
    return <Navigate to={requireStaff ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-charcoal-900/20 border-t-clay-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (requireStaff && user?.user_type !== "STAFF") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireStaff && user?.user_type === "STAFF") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
