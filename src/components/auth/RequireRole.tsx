import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthRole, isRoleAuthenticated } from "@/lib/auth";

interface RequireRoleProps {
  role: AuthRole;
}

const redirectByRole: Record<AuthRole, string> = {
  admin: "/login",
  doctor: "/login",
};

export default function RequireRole({ role }: RequireRoleProps) {
  const location = useLocation();

  if (!isRoleAuthenticated(role)) {
    return <Navigate to={redirectByRole[role]} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
