import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, firstError } from '../api'

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Port Said', 'Suez', 'Luxor', 'Aswan',
  'Dakahlia', 'Sharqia', 'Gharbia', 'Monufia', 'Beheira', 'Ismailia', 'Fayoum',
]

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    governorate: '',
    city: '',
    street: '',
  })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const body = { ...form }
    if (photo) body.photo = photo
    const res = await api.signup(body)
    setBusy(false)
    if (res.ok) {
      navigate('/login', { state: { notice: 'Account created — log in.' } })
    } else {
      setError(firstError(res.data))
    }
  }

  return (
    <div className="sheet sheet-narrow">
      <span className="pin pin-lg" aria-hidden="true" />
      <p className="eyebrow">Join the board</p>
      <h1>Create your account</h1>

      <form onSubmit={submit} className="form">
        <div className="form-row">
          <label className="field">
            <span>First name</span>
            <input value={form.first_name} onChange={set('first_name')} required />
          </label>
          <label className="field">
            <span>Last name</span>
            <input value={form.last_name} onChange={set('last_name')} required />
          </label>
        </div>

        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Phone number</span>
            <input value={form.phone_number} onChange={set('phone_number')} placeholder="+20…" required />
          </label>
          <label className="field">
            <span>Governorate</span>
            <select value={form.governorate} onChange={set('governorate')}>
              <option value="">— pick one —</option>
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>City</span>
            <input value={form.city} onChange={set('city')} />
          </label>
          <label className="field">
            <span>Street</span>
            <input value={form.street} onChange={set('street')} />
          </label>
        </div>

        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
          <small className="hint">At least 8 characters. Mix letters and numbers.</small>
        </label>

        <label className="field">
          <span>Profile photo (optional)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <div className="form-error" role="alert">{error}</div>}

        <button className="btn btn-amber btn-block" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="sheet-alt">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
