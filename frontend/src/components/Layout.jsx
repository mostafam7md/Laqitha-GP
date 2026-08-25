import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { authed, user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user
    ? [user.first_name, user.last_name].filter(Boolean).map((w) => w[0]).join('').toUpperCase() || user.email[0].toUpperCase()
    : '?'

  return (
    <div className="board">
      <header className="nav">
        <Link to="/" className="brand">
          <span className="pin pin-brand" aria-hidden="true" />
          <span className="brand-en">Laqitha</span>
          <span className="brand-ar">لقيتها</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>Browse</NavLink>
          {authed && (
            <>
              <NavLink to="/report">Report an item</NavLink>
              <NavLink to="/chats">Chats</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </>
          )}
        </nav>

        <div className="nav-auth">
          {authed ? (
            <>
              <Link to="/profile" className="avatar" title={user?.email}>{initials}</Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-amber btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">
        <span>Laqitha · لقيتها — lost & found, back in the right hands.</span>
      </footer>
    </div>
  )
}
