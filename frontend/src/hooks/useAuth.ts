import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface JWTPayload {
  sub: string
  email: string
  name?: string
  exp: number
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function useAuth() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const user = useMemo(() => {
    if (!token) return null
    const payload = decodeJWT(token)
    if (!payload || payload.exp * 1000 < Date.now()) return null
    return { id: payload.sub, email: payload.email, name: payload.name ?? payload.email }
  }, [token])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return { user, isAuthenticated: !!user, logout }
}
