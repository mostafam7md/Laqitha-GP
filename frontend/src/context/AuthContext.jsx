import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken as persistToken, clearToken, decodeUserId } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userId, setUserId] = useState(decodeUserId())
  const [ready, setReady] = useState(false)

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return null
    }
    const res = await api.getProfile()
    if (res.ok) {
      setUser(res.data)
      return res.data
    }
    if (res.status === 401) logout()
    return null
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setReady(true))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password })
    if (res.ok && res.data?.access_token) {
      persistToken(res.data.access_token)
      setUserId(decodeUserId())
      await refreshUser()
    }
    return res
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setUserId(null)
  }, [])

  const value = {
    user,
    userId,
    ready,
    authed: !!getToken(),
    login,
    logout,
    refreshUser,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
