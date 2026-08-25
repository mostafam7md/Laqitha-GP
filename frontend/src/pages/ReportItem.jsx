import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api, firstError, COLORS } from '../api'

export default function ReportItem() {
  const { id } = useParams()
  const editing = !!id
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    item_name: '',
    description: '',
    category_id: '',
    color: '',
    unique_marks: '',
    main_photo_url: '',
    initial_found_time: '',
    final_found_time: '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(!editing)

  useEffect(() => {
    api.listCategories().then((res) => {
      if (res.ok && Array.isArray(res.data)) setCategories(res.data)
    })
  }, [])

  useEffect(() => {
    if (!editing) return
    api.getItem(id).then((res) => {
      if (res.ok) {
        const it = res.data
        setForm({
          item_name: it.item_name ?? '',
          description: it.description ?? '',
          category_id: it.category?.id ?? '',
          color: it.color ?? '',
          unique_marks: it.unique_marks ?? '',
          main_photo_url: it.main_photo_url ?? '',
          initial_found_time: toLocalInput(it.initial_found_time),
          final_found_time: toLocalInput(it.final_found_time),
        })
        setLoaded(true)
      } else {
        setError('Could not load this item for editing.')
      }
    })
  }, [editing, id])

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)

    if (!form.item_name.trim()) {
      setError('Give the item a name.')
      return
    }

    const body = {
      item_name: form.item_name.trim(),
      description: form.description.trim(),
      color: form.color.trim().toLowerCase(),
      unique_marks: form.unique_marks.trim(),
      initial_found_time: form.initial_found_time || null,
      final_found_time: form.final_found_time || null,
    }
    if (form.category_id) body.category_id = Number(form.category_id)
    if (form.main_photo_url.trim()) body.main_photo_url = form.main_photo_url.trim()

    setSaving(true)
    const res = editing ? await api.updateItem(id, body) : await api.createItem(body)
    setSaving(false)

    if (res.ok) navigate(`/items/${res.data.id}`)
    else setError(firstError(res.data))
  }

  if (!loaded && !error) return <div className="loading" role="status">Loading…</div>

  return (
    <div className="sheet">
      <span className="pin pin-lg" aria-hidden="true" />
      <p className="eyebrow">{editing ? `Editing notice #${id}` : 'New notice'}</p>
      <h1>{editing ? 'Update this notice' : 'Pin an item to the board'}</h1>
      <p className="sheet-sub">
        The more detail you give — color, marks, where and when — the faster a match happens.
      </p>

      {error && <div className="form-error" role="alert">{error}</div>}

      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Item name *</span>
          <input value={form.item_name} onChange={set('item_name')} placeholder="Black leather wallet" required />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={set('description')}
            placeholder="Where it was lost/found and any context that helps."
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Category</span>
            <select value={form.category_id} onChange={set('category_id')}>
              <option value="">— pick one —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Color</span>
            <input list="color-options" value={form.color} onChange={set('color')} placeholder="black" />
            <datalist id="color-options">
              {COLORS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="field">
          <span>Unique marks</span>
          <input
            value={form.unique_marks}
            onChange={set('unique_marks')}
            placeholder="Scratch on the left corner"
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>First seen</span>
            <input type="datetime-local" value={form.initial_found_time} onChange={set('initial_found_time')} />
          </label>
          <label className="field">
            <span>Closed / returned</span>
            <input type="datetime-local" value={form.final_found_time} onChange={set('final_found_time')} />
          </label>
        </div>

        <label className="field">
          <span>Photo URL</span>
          <input
            type="url"
            value={form.main_photo_url}
            onChange={set('main_photo_url')}
            placeholder="https://example.com/photo.jpg"
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-amber" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Pin it to the board'}
          </button>
          <Link to={editing ? `/items/${id}` : '/'} className="btn btn-ghost-dark">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
