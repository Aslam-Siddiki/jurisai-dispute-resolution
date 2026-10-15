import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Scale, User, Mail, Lock, Phone, Briefcase, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { NODE_API_BASE as API } from '../config/api'

const BASE_ROLES = [
  { value: 'claimant',   label: 'Claimant',    desc: 'I am filing a dispute' },
  { value: 'respondent', label: 'Respondent',  desc: 'I have been invited to respond' },
  { value: 'mediator',   label: 'Mediator',    desc: 'I am a dispute arbitrator' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [hasAdmin, setHasAdmin] = useState(true) // default to true until checked
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', organization: '', role: 'claimant'
  })

  useEffect(() => {
    axios.get(`${API}/auth/admin-status`)
      .then(res => setHasAdmin(res.data?.hasAdmin))
      .catch(() => setHasAdmin(true))
  }, [])

  const availableRoles = hasAdmin 
    ? BASE_ROLES 
    : [...BASE_ROLES, { value: 'admin', label: 'Admin', desc: 'Full platform administration' }]
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { name, email, password, phone, organization, role } = form
      await register({ name, email, password, phone, organization, role })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot connect to backend server. Please make sure the server is running on port 5000.'
          : 'Registration failed. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gradient-primary)', padding: '1rem', borderRadius: '1rem',
            boxShadow: '0 0 32px rgba(59,130,246,0.4)', marginBottom: '1rem'
          }}>
            <Scale size={32} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Join JurisAI — AI-powered civil dispute resolution
          </p>
        </div>

        <div className="card fade-up">
          <div className="card-body">
            <form onSubmit={submit}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label">I am registering as</label>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${availableRoles.length}, 1fr)`, gap: '0.75rem' }}>
                  {availableRoles.map(r => (
                    <label
                      key={r.value}
                      htmlFor={`role-${r.value}`}
                      style={{
                        cursor: 'pointer',
                        padding: '0.85rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${form.role === r.value ? 'var(--accent-blue)' : 'var(--border)'}`,
                        background: form.role === r.value ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                        textAlign: 'center',
                        transition: 'all var(--transition)',
                        display: 'flex', flexDirection: 'column', gap: '0.25rem'
                      }}
                    >
                      <input type="radio" id={`role-${r.value}`} name="role" value={r.value} checked={form.role === r.value} onChange={handle} style={{ display: 'none' }} />
                      {form.role === r.value && <CheckCircle size={16} style={{ color: 'var(--accent-blue)', margin: '0 auto' }} />}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: form.role === r.value ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {r.label}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="reg-name">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="reg-name" className="form-control" style={{ paddingLeft: '2.4rem' }} type="text" name="name" placeholder="John Smith" value={form.name} onChange={handle} required />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="reg-phone">Phone (optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="reg-phone" className="form-control" style={{ paddingLeft: '2.4rem' }} type="tel" name="phone" placeholder="+1 555 0000" value={form.phone} onChange={handle} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-email" className="form-control" style={{ paddingLeft: '2.4rem' }} type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-org">Organization / Company (optional)</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-org" className="form-control" style={{ paddingLeft: '2.4rem' }} type="text" name="organization" placeholder="Acme Corp" value={form.organization} onChange={handle} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="reg-password"
                      className="form-control"
                      style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Min. 6 characters"
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="reg-confirm"
                      className="form-control"
                      style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={handle}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                className="btn btn-primary w-full"
                style={{ marginTop: '1.25rem', justifyContent: 'center', padding: '0.85rem' }}
                disabled={loading}
              >
                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <UserPlus size={18} />}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="divider" style={{ margin: '1.5rem 0' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
