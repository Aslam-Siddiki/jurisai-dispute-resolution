import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Scale, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot connect to backend server. Please make sure the server is running on port 5000.'
          : 'Login failed. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gradient-primary)', padding: '1rem', borderRadius: '1rem',
            boxShadow: '0 0 32px rgba(59,130,246,0.4)', marginBottom: '1rem'
          }}>
            <Scale size={32} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Sign in to your JurisAI account
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={submit}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handle}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-password"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handle}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="btn btn-primary w-full"
                style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.85rem' }}
                disabled={loading}
              >
                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <LogIn size={18} />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="divider" style={{ margin: '1.5rem 0' }} />

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Admin hint */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Admin accounts are provisioned by your system administrator.
        </p>
      </div>
    </div>
  )
}
