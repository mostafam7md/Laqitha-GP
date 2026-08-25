const TOKEN_KEY = 'laqitha_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export function decodeUserId() {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.user_id ?? null
  } catch {
    return null
  }
}

async function req(method, path, { body, auth = false } = {}) {
  const headers = {}
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'
  if (auth && getToken()) headers['Authorization'] = `Bearer ${getToken()}`

  const res = await fetch(path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

function firstError(data) {
  if (!data) return 'Something went wrong.'
  if (typeof data === 'string') return data.slice(0, 300)
  if (typeof data.detail === 'string') return data.detail
  for (const [field, msgs] of Object.entries(data)) {
    if (Array.isArray(msgs)) return `${field}: ${msgs[0]}`
    if (typeof msgs === 'string') return `${field}: ${msgs}`
  }
  return 'Something went wrong.'
}

export { firstError }

export const api = {
  signup: (body) => req('POST', '/api/accounts/signup/', { body }),
  login: (body) => req('POST', '/api/accounts/login/', { body }),

  getProfile: () => req('GET', '/api/accounts/profile/', { auth: true }),
  updateProfile: (data) => {
    let body
    if (data.photo instanceof File || Object.values(data).some((v) => v instanceof File)) {
      body = new FormData()
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== null && v !== '') body.append(k, v)
      }
    } else {
      body = {}
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== '') body[k] = v
      }
    }
    return req('PATCH', '/api/accounts/profile/', { body, auth: true })
  },
  changePassword: (body) => req('POST', '/api/accounts/profile/change-password/', { body, auth: true }),
  deactivate: () => req('POST', '/api/accounts/deactivate/', { auth: true }),
  forgotPassword: (email) => req('POST', '/api/accounts/password/forgot/', { body: { email } }),
  verifyResetToken: (token) => req('GET', `/api/accounts/password/reset/verify/?token=${encodeURIComponent(token)}`),
  resetPassword: (body) => req('POST', '/api/accounts/password/reset/confirm/', { body }),

  listItems: (params = {}) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    }
    const s = qs.toString()
    return req('GET', `/api/items/${s ? `?${s}` : ''}`)
  },
  getItem: (id) => req('GET', `/api/items/${id}/`),
  createItem: (body) => req('POST', '/api/items/', { body, auth: true }),
  updateItem: (id, body) => req('PATCH', `/api/items/${id}/`, { body, auth: true }),
  deleteItem: (id) => req('DELETE', `/api/items/${id}/`, { auth: true }),

  listCategories: () => req('GET', '/api/categories/'),

  listChats: () => req('GET', '/api/chat/user-chats/', { auth: true }),
  startChat: (itemId) => req('POST', '/api/chat/start/', { body: { item_id: itemId }, auth: true }),
}

const COLORS = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 'orange', 'pink', 'purple', 'silver', 'gold']
export { COLORS }

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
