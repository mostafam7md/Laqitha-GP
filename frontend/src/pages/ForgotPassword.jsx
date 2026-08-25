import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, firstError } from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await api.forgotPassword(email.trim())
    setBusy(false)
    if (res.ok) setSent(true)
    else setError(firstError(res.data))
  }

  return (
    <div className="sheet sheet-narrow">
      <span className="pin pin-lg" aria-hidden="true" />
      <p className="eyebrow">Account recovery</p>
      <h1>Reset your password</h1>

      {sent ? (
        <>
          <div className="note note-ok">
            If that email belongs to an account, a reset link is on its way. It's valid for 30 minutes.
          </div>
          <p className="sheet-alt"><Link to="/login">Back to log in</Link></p>
        </>
      ) : (
        <form onSubmit={submit} className="form">
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="btn btn-amber btn-block" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  )
}
