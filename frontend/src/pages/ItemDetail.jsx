import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, formatDate } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authed, userId } = useAuth()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [startingChat, setStartingChat] = useState(false)

  async function startChat() {
    setStartingChat(true)
    const res = await api.startChat(id)
    if (res.ok) {
      navigate('/chats')
    } else {
      setStartingChat(false)
      setError(typeof res.data?.detail === 'string' ? res.data.detail : 'Could not start the chat. Try again.')
    }
  }

  useEffect(() => {
    let alive = true
    api.getItem(id).then((res) => {
      if (!alive) return
      if (res.ok) setItem(res.data)
      else setError(res.status === 404 ? 'This item is not on the board anymore.' : 'Could not load this item.')
    })
    return () => {
      alive = false
    }
  }, [id])

  async function remove() {
    setDeleting(true)
    const res = await api.deleteItem(id)
    if (res.ok || res.status === 204 || res.status === 404) {
      navigate('/')
    } else {
      setDeleting(false)
      setError('Delete failed. Try again.')
    }
  }

  if (error) {
    return (
      <div className="empty">
        <h2>Nothing to see here</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-paper">Back to the board</Link>
      </div>
    )
  }
  if (!item) return <div className="loading" role="status">Fetching the notice…</div>

  const mine = authed && userId != null && item.owner_user === userId
  const reunited = !!item.final_found_time

  return (
    <article className={`detail ${reunited ? 'is-reunited' : ''}`}>
      <span className="pin pin-lg" aria-hidden="true" />
      {reunited && <span className="stamp stamp-mint">Reunited</span>}

      <div className="detail-head">
        <div>
          <p className="eyebrow">Notice #{item.id}{item.category ? ` · ${item.category.category_name}` : ''}</p>
          <h1>{item.item_name}</h1>
        </div>
        {mine && (
          <div className="detail-owner-actions">
            <Link className="btn btn-ghost-dark btn-sm" to={`/items/${item.id}/edit`}>Edit</Link>
            {!confirming && (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirming(true)}>Delete</button>
            )}
          </div>
        )}
      </div>

      {confirming && (
        <div className="confirm-strip">
          <span>Delete “{item.item_name}” from the board?</span>
          <button className="btn btn-danger btn-sm" onClick={remove} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button className="btn btn-ghost-dark btn-sm" onClick={() => setConfirming(false)}>Keep it</button>
        </div>
      )}

      {item.main_photo_url && (
        <img className="detail-photo" src={item.main_photo_url} alt={item.item_name} />
      )}

      {item.description && <p className="detail-desc">{item.description}</p>}

      <dl className="detail-meta">
        <div><dt>Color</dt><dd>{item.color || '—'}</dd></div>
        <div><dt>Unique marks</dt><dd>{item.unique_marks || '—'}</dd></div>
        <div><dt>Reported</dt><dd>{formatDate(item.created_at)}</dd></div>
        <div><dt>First seen</dt><dd>{formatDate(item.initial_found_time)}</dd></div>
        <div><dt>Closed</dt><dd>{formatDate(item.final_found_time)}</dd></div>
        <div><dt>Owner</dt><dd>User #{item.owner_user}</dd></div>
      </dl>

      <aside className="contact-card">
        <h2>Think it's yours?</h2>
        <p>
          Describe the unique marks when you reach out — that's how owners verify a real match.
        </p>
        {authed ? (
          mine ? (
            <p className="muted">This is your notice — chats about it will appear in your inbox.</p>
          ) : (
            <button className="btn btn-amber" onClick={startChat} disabled={startingChat}>
              {startingChat ? 'Starting chat…' : 'Start chat with the poster'}
            </button>
          )
        ) : (
          <>
            <p className="muted">You need an account to start a conversation.</p>
            <Link to="/login" className="btn btn-amber">Log in</Link>
          </>
        )}
      </aside>
    </article>
  )
}
