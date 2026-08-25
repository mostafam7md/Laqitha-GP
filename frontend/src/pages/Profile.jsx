import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, firstError } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, setUser, refreshUser, logout } = useAuth()
  const navigate = useNavigate()

  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const [pw, setPw] = useState({ current_password: '', new_password: '' })
  const [pwMsg, setPwMsg] = useState(null)

  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    refreshUser()
  }, [])

  function startEdit() {
    setForm({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      phone_number: user?.phone_number ?? '',
      governorate: user?.governorate ?? '',
      city: user?.city ?? '',
      street: user?.street ?? '',
    })
    setPhotoFile(null)
    setMsg(null)
    setEdit(true)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await api.updateProfile({ ...form, ...(photoFile ? { photo: photoFile } : {}) })
    setBusy(false)
    if (res.ok) {
      setUser(res.data.user ?? res.data)
      await refreshUser()
      setEdit(false)
      setMsg({ ok: true, text: 'Profile saved.' })
    } else {
      setMsg({ ok: false, text: firstError(res.data) })
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg(null)
    const res = await api.changePassword(pw)
    if (res.ok) {
      setPw({ current_password: '', new_password: '' })
      setPwMsg({ ok: true, text: 'Password updated.' })
    } else {
      setPwMsg({ ok: false, text: firstError(res.data) })
    }
  }

  async function deactivate() {
    setBusy(true)
    const res = await api.deactivate()
    setBusy(false)
    if (res.ok) {
      logout()
      navigate('/', { state: { notice: 'Account deactivated. Log in within 30 days to restore it.' } })
    } else {
      setMsg({ ok: false, text: firstError(res.data) })
    }
  }

  if (!user) return <div className="loading" role="status">Loading your profile…</div>

  return (
    <div className="profile">
      <section className="sheet">
        <span className="pin pin-lg" aria-hidden="true" />
        <div className="profile-head">
          {user.photo ? (
            <img className="avatar avatar-xl" src={user.photo} alt="" />
          ) : (
            <span className="avatar avatar-xl">{(user.first_name || user.email)[0].toUpperCase()}</span>
          )}
          <div>
            <p className="eyebrow">Your profile</p>
            <h1>{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}</h1>
          </div>
          {!edit && (
            <button className="btn btn-ghost-dark btn-sm profile-edit-btn" onClick={startEdit}>Edit</button>
          )}
        </div>

        {msg && <div className={`note ${msg.ok ? 'note-ok' : 'note-fail'}`}>{msg.text}</div>}

        {!edit ? (
          <dl className="detail-meta">
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Phone</dt><dd>{user.phone_number || '—'}</dd></div>
            <div><dt>Governorate</dt><dd>{user.governorate || '—'}</dd></div>
            <div><dt>City</dt><dd>{user.city || '—'}</dd></div>
            <div><dt>Street</dt><dd>{user.street || '—'}</dd></div>
            <div><dt>Status</dt><dd>{user.status}</dd></div>
          </dl>
        ) : (
          <form onSubmit={save} className="form">
            <div className="form-row">
              <label className="field"><span>First name</span>
                <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
              </label>
              <label className="field"><span>Last name</span>
                <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
              </label>
            </div>
            <div className="form-row">
              <label className="field"><span>Phone</span>
                <input value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} />
              </label>
              <label className="field"><span>Governorate</span>
                <input value={form.governorate} onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))} />
              </label>
            </div>
            <div className="form-row">
              <label className="field"><span>City</span>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </label>
              <label className="field"><span>Street</span>
                <input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
              </label>
            </div>
            <label className="field"><span>Replace photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="form-actions">
              <button className="btn btn-amber" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="btn btn-ghost-dark" onClick={() => setEdit(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="sheet">
        <span className="pin pin-lg" aria-hidden="true" />
        <h2>Change password</h2>
        <form onSubmit={changePassword} className="form">
          <div className="form-row">
            <label className="field"><span>Current password</span>
              <input
                type="password"
                value={pw.current_password}
                onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
                required
              />
            </label>
            <label className="field"><span>New password</span>
              <input
                type="password"
                value={pw.new_password}
                onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
                required
                minLength={8}
              />
            </label>
          </div>
          {pwMsg && <div className={`note ${pwMsg.ok ? 'note-ok' : 'note-fail'}`}>{pwMsg.text}</div>}
          <div className="form-actions">
            <button className="btn btn-paper-dark">Update password</button>
          </div>
        </form>
      </section>

      <section className="sheet sheet-danger">
        <h2>Deactivate account</h2>
        <p className="muted">
          Your notices are hidden and your account is parked. Logging in within 30 days restores everything.
        </p>
        {!confirmDeactivate ? (
          <button className="btn btn-danger" onClick={() => setConfirmDeactivate(true)}>Deactivate my account</button>
        ) : (
          <div className="confirm-strip">
            <span>Sure? This can be undone by logging back in within 30 days.</span>
            <button className="btn btn-danger btn-sm" onClick={deactivate} disabled={busy}>
              {busy ? 'Working…' : 'Yes, deactivate'}
            </button>
            <button className="btn btn-ghost-dark btn-sm" onClick={() => setConfirmDeactivate(false)}>Keep it</button>
          </div>
        )}
        <p className="muted small">
          Lost access instead? <Link to="/forgot-password">Send yourself a reset link.</Link>
        </p>
      </section>
    </div>
  )
}
