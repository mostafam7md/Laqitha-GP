import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth() {
  const { authed, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <div className="loading" role="status">Checking your session…</div>
  if (!authed) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}
