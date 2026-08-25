import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { firstError } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await login(email.trim(), password)
    setBusy(false)
    if (res.ok) {
      navigate(location.state?.from ?? '/', { replace: true })
    } else {
      setError(firstError(res.data))
    }
  }

  return (
    <div className="sheet sheet-narrow">
      <span className="pin pin-lg" aria-hidden="true" />
      <p className="eyebrow">Welcome back</p>
      <h1>Log in to Laqitha</h1>

      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="form-error" role="alert">{error}</div>}

        <button className="btn btn-amber btn-block" disabled={busy}>
          {busy ? 'Checking…' : 'Log in'}
        </button>
      </form>

      <p className="sheet-alt">
        New here? <Link to="/signup">Create an account</Link>
        <br />
        Forgot your password? <Link to="/forgot-password">Send a reset link</Link>
      </p>
    </div>
  )
}
