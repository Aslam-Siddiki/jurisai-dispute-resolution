import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

import { NODE_API_BASE as API } from '../config/api'

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('jurisai_token'))
  const [loading, setLoading] = useState(true)

  // Attach token to every axios request
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('jurisai_token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('jurisai_token')
    }
  }, [token])

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('jurisai_token')
    if (!stored) { setLoading(false); return }
    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => { setUser(r.data.user); setToken(stored) })
      .catch(() => { setToken(null); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await axios.post(`${API}/auth/register`, payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const { data } = await axios.put(`${API}/auth/change-password`, { currentPassword, newPassword })
    return data
  }, [])

  const deleteAccount = useCallback(async (password) => {
    const { data } = await axios.delete(`${API}/auth/delete-account`, { data: { password } })
    logout()
    return data
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, changePassword, deleteAccount, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  // Return a safe default during HMR / before AuthProvider mounts
  if (!ctx) return { user: null, token: null, loading: true, isAdmin: false, login: async () => {}, register: async () => {}, logout: () => {} }
  return ctx
}
