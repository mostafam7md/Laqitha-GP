import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, getToken } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Chats() {
  const { user, userId } = useAuth()
  const [chats, setChats] = useState(null)
  const [live, setLive] = useState({})
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [connected, setConnected] = useState(false)
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState(null)

  const socketRef = useRef(null)
  const threadRef = useRef(null)

  useEffect(() => {
    api.listChats().then((res) => {
      if (res.ok) {
        setChats(res.data)
        if (Array.isArray(res.data) && res.data.length > 0) setOpenId(res.data[0].id)
      } else {
        setError('Could not load your chats.')
      }
    })
  }, [])

  useEffect(() => {
    if (!openId || !getToken()) return

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(
      `${proto}://${window.location.host}/ws/chat/${openId}/?token=${encodeURIComponent(getToken())}`,
    )
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setLive((prev) => ({
          ...prev,
          [openId]: [
            ...(prev[openId] ?? []),
            { message: data.message, sender_id: data.sender_id, timestamp: data.timestamp },
          ],
        }))
      } catch {
        /* ignore malformed frames */
      }
    }

    return () => {
      socket.onclose = null
      socket.close()
      socketRef.current = null
      setConnected(false)
    }
  }, [openId])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [live, openId])

  function send(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSendError(null)
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setSendError('Chat is not connected yet — try again in a moment.')
      return
    }
    socketRef.current.send(JSON.stringify({ message: text }))
    setDraft('')
  }

  function otherSide(chat) {
    const sender = typeof chat.user_chat_sender === 'object' ? chat.user_chat_sender?.id : chat.user_chat_sender
    const receiver = typeof chat.user_chat_receiver === 'object' ? chat.user_chat_receiver?.id : chat.user_chat_receiver
    return `User #${sender === userId ? receiver : sender}`
  }

  function otherPhoto(chat) {
    const sender = typeof chat.user_chat_sender === 'object' ? chat.user_chat_sender : null
    const receiver = typeof chat.user_chat_receiver === 'object' ? chat.user_chat_receiver : null
    if (sender && receiver) return sender.id === userId ? receiver.photo : sender.photo
    return null
  }

  const DEFAULT_AVATAR = '/media/avatars/default.png'
  const myPhoto = user?.photo || DEFAULT_AVATAR

  if (error) return <div className="empty"><h2>Chats unavailable</h2><p>{error}</p></div>
  if (chats === null) return <div className="loading" role="status">Loading chats…</div>

  return (
    <div className="chats">
      <header className="chats-head">
        <p className="eyebrow">Conversations</p>
        <h1>Your chats</h1>
      </header>

      {chats.length === 0 && (
        <div className="empty">
          <h2>No conversations yet</h2>
          <p>Chats open up around item notices — report or browse to get things moving.</p>
          <Link to="/" className="btn btn-amber">Browse the board</Link>
        </div>
      )}

      <div className="chat-list">
        {chats.map((chat) => {
          const messages = [...(chat.messages ?? []), ...(live[chat.id] ?? [])].sort(
            (a, b) => new Date(a.Timestamp || a.timestamp || 0) - new Date(b.Timestamp || b.timestamp || 0),
          )
          const open = chat.id === openId
          const last = messages[messages.length - 1]

          return (
            <article key={chat.id} className={`chat ${open ? 'chat-open' : ''}`}>
              <button
                className="chat-summary"
                onClick={() => setOpenId(open ? null : chat.id)}
                aria-expanded={open}
              >
                <span className="avatar">{otherSide(chat).replace('User #', '#')}</span>
                <span className="chat-info">
                  <strong>{otherSide(chat)}</strong>
                  <span className="muted">
                    {last ? String(last.message ?? last.content ?? '') : 'No messages yet'}
                  </span>
                </span>
                <span className={`pill ${chat.status === 'CLOSED' ? 'pill-fail' : 'pill-ok'}`}>{chat.status}</span>
                <span className="chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
              </button>

              {open && (
                <>
                  <div className="thread" ref={threadRef}>
                    {messages.length === 0 && (
                      <p className="muted thread-empty">Nothing said yet — say hi 👋</p>
                    )}
                    {messages.map((m, i) => {
                      const mine = m.sender === userId || m.sender_id === userId
                      return (
                        <div key={i} className={`msg-row ${mine ? 'msg-mine' : ''}`}>
                          <img
                            className="msg-avatar"
                            src={mine ? myPhoto : (otherPhoto(chat) || DEFAULT_AVATAR)}
                            alt=""
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR }}
                          />
                          <div className={`bubble ${mine ? 'bubble-mine' : ''}`}>
                            <p>{String(m.message ?? m.content ?? '')}</p>
                            <time>{formatDate(m.Timestamp || m.timestamp)}</time>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <form className="composer" onSubmit={send}>
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message…"
                      autoFocus
                      aria-label="Message"
                    />
                    <button className="btn btn-amber btn-sm" type="submit" disabled={!draft.trim()}>
                      Send
                    </button>
                  </form>
                  {sendError && <p className="muted small composer-error">{sendError}</p>}
                  {!connected && !sendError && (
                    <p className="muted small">Connecting to live chat…</p>
                  )}
                </>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
