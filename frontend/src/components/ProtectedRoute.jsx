import { Navigate } from "react-router-dom"

import { getToken, getUser } from "@/lib/auth"

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(getUser()?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
