import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, COLORS } from '../api'
import { useAuth } from '../context/AuthContext'
import ItemCard from '../components/ItemCard'

export default function Browse() {
  const { authed } = useAuth()
  const [items, setItems] = useState(null)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ category: '', color: '' })

  useEffect(() => {
    api.listCategories().then((res) => {
      if (res.ok && Array.isArray(res.data)) setCategories(res.data)
    })
  }, [])

  useEffect(() => {
    let alive = true
    setItems(null)
    setError(null)
    api.listItems({ category: filters.category || undefined, color: filters.color || undefined }).then((res) => {
      if (!alive) return
      if (res.ok) setItems(res.data)
      else setError('Could not load items. Is the backend running?')
    })
    return () => {
      alive = false
    }
  }, [filters])

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Lost &amp; found · Cairo and beyond</p>
        <h1>
          Lost something?
          <br />
          Someone may have <em>found it</em>.
        </h1>
        <p className="hero-sub">
          Post what you lost or what you found. Browse the board, spot a match, and get it back where it
          belongs.
        </p>
        <div className="hero-actions">
          <Link to={authed ? '/report' : '/signup'} className="btn btn-amber">Report an item</Link>
          {!authed && <Link to="/login" className="btn btn-paper">Log in</Link>}
        </div>
        {Array.isArray(items) && (
          <p className="hero-stat">
            <strong>{items.length}</strong> item{items.length === 1 ? '' : 's'} currently on the board
          </p>
        )}
      </section>

      <section className="filters" aria-label="Filters">
        <label className="field field-select">
          <span>Category</span>
          <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.category_name}</option>
            ))}
          </select>
        </label>

        <div className="color-chips" role="group" aria-label="Filter by color">
          <button
            className={`chip ${filters.color === '' ? 'chip-on' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, color: '' }))}
          >
            any
          </button>
          {COLORS.map((c) => (
            <button
              key={c}
              className={`chip chip-${c} ${filters.color === c ? 'chip-on' : ''}`}
              onClick={() => setFilters((f) => ({ ...f, color: f.color === c ? '' : c }))}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Items">
        {error && <div className="empty"><h2>Board unavailable</h2><p>{error}</p></div>}

        {!error && items === null && <div className="loading" role="status">Loading the board…</div>}

        {!error && Array.isArray(items) && items.length === 0 && (
          <div className="empty">
            <h2>Nothing here yet</h2>
            <p>No items match this view. Clear the filters or be the first to report one.</p>
            <Link to="/report" className="btn btn-amber">Report an item</Link>
          </div>
        )}

        {!error && Array.isArray(items) && items.length > 0 && (
          <div className="notice-grid">
            {items.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
