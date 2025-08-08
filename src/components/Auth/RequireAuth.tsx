import { Navigate, useLocation } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // could render a skeleton/spinner if desired
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <>{children}</>;
}
