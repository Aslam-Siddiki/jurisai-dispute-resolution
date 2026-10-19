import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  Shield, Folders, Users, TrendingUp, Trash2, Eye,
  Search, AlertCircle, CheckCircle, Clock, Scale,
  ChevronRight, RefreshCw, Filter
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { NODE_API_BASE as API, PYTHON_API_BASE as PYTHON_API } from '../config/api'

const STATUS_STYLES = {
  draft:              { cls: 'badge-muted',   label: 'Draft' },
  pending:            { cls: 'badge-amber',   label: 'Pending' },
  submitted:          { cls: 'badge-blue',    label: 'Submitted' },
  invited:            { cls: 'badge-blue',    label: 'Invited' },
  accepted:           { cls: 'badge-cyan',    label: 'Accepted' },
  submissions_open:   { cls: 'badge-amber',   label: 'Open' },
  submissions_closed: { cls: 'badge-violet',  label: 'Closed' },
  ai_evaluation:      { cls: 'badge-violet',  label: 'AI Analysis' },
  analyzing:          { cls: 'badge-violet',  label: 'AI Analysis' },
  decision_issued:    { cls: 'badge-blue',    label: 'Decision Issued' },
  complete:           { cls: 'badge-green',   label: 'Evaluated' },
  settled_accepted:   { cls: 'badge-green',   label: '✓ Settled' },
  appealed_mediator:  { cls: 'badge-red',     label: 'Appealed' },
  solved:             { cls: 'badge-green',   label: '✓ Solved' },
  declined:           { cls: 'badge-red',     label: 'Declined' },
  expired:            { cls: 'badge-muted',   label: 'Expired' },
}

import { useRealtimeEvents } from '../context/useRealtimeEvents'
import { Activity, Bell, X } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user } = useAuth()

  const [cases, setCases]   = useState([])
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)
  const [tab, setTab]       = useState('cases') // 'cases' | 'users'
  const [error, setError]   = useState('')

  const load = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    setError('')
    try {
      const [casesRes, pythonRes, usersRes] = await Promise.allSettled([
        axios.get(`${API}/cases`),
        axios.get(`${PYTHON_API}/disputes`),
        axios.get(`${API}/auth/users`),
      ])

      const nodeCases = casesRes.status === 'fulfilled' ? casesRes.value.data || [] : []
      const pyCases = pythonRes.status === 'fulfilled' ? pythonRes.value.data || [] : []
      const loadedUsers = usersRes.status === 'fulfilled' ? usersRes.value.data?.users || [] : []

      // Normalize Python cases for admin table
      const normalizedPyCases = pyCases.map(d => ({
        _id: d.id,
        title: d.title,
        status: d.status,
        disputeType: d.category || 'Civil Dispute',
        claimantName: d.party_a_name || 'Claimant',
        claimantEmail: d.party_a_email || '—',
        respondentName: d.party_b_name || 'Respondent',
        respondentEmail: d.party_b_email || '—',
        createdAt: d.created_at,
        _pythonDispute: true
      }))

      // Combine and deduplicate
      const combined = [...nodeCases]
      const titles = new Set(combined.map(c => c.title?.toLowerCase()?.trim()))

      for (const p of normalizedPyCases) {
        if (!titles.has(p.title?.toLowerCase()?.trim())) {
          combined.push(p)
          titles.add(p.title?.toLowerCase()?.trim())
        }
      }

      setCases(combined)
      setUsers(loadedUsers)
    } catch (err) {
      if (!isBackground) {
        setError('Failed to load admin data: ' + (err.response?.data?.message || err.message))
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  useEffect(() => { load(false) }, [])

  // Hook into real-time server events (SSE) for instant admin updates
  const { isConnected, lastNotification, dismissNotification } = useRealtimeEvents(() => {
    load(true)
  })

  const deleteCase = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await axios.delete(`${API}/cases/${id}`)
      setCases(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setDeleting(null)
    }
  }

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Remove user "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await axios.delete(`${API}/auth/users/${id}`)
      setUsers(prev => prev.filter(u => u._id !== id))
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setDeleting(null)
    }
  }

  // Stats
  const stats = {
    total:    cases.length,
    active:   cases.filter(c => !['settled_accepted','solved','appealed_mediator','declined','expired'].includes(c.status)).length,
    settled:  cases.filter(c => ['settled_accepted','solved'].includes(c.status)).length,
    users:    users.length,
  }

  // Filtered cases
  const filtered = cases.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.title?.toLowerCase().includes(q) || c.claimantName?.toLowerCase().includes(q) || c.respondentName?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const statuses = [...new Set(cases.map(c => c.status))]

  return (
    <div className="page-content">
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239,68,68,0.35)'
            }}>
              <Shield size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
                Admin Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span>{user?.name} &bull;</span>
                <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>administrator</span>
                <span
                  title={isConnected ? 'Live real-time stream active' : 'Connecting to live events stream...'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '1rem',
                    background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: isConnected ? '#34d399' : '#fbbf24',
                    border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                  }}
                >
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isConnected ? '#10b981' : '#f59e0b',
                    boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
                    display: 'inline-block'
                  }} />
                  {isConnected ? 'Real-Time Connected' : 'Syncing...'}
                </span>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => load(false)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Live Event Notification Banner */}
        {lastNotification && (
          <div className="alert alert-info fade-up" style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(139,92,246,0.1))',
            borderColor: 'rgba(239,68,68,0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Bell size={18} style={{ color: '#f87171' }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.88rem' }}>Real-Time Platform Event: </strong>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{lastNotification.message}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({lastNotification.timestamp.toLocaleTimeString()})
                </span>
              </div>
            </div>
            <button
              onClick={dismissNotification}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Cases', value: stats.total, icon: <Folders size={20} />, color: 'var(--accent-blue)' },
            { label: 'Active',      value: stats.active, icon: <Clock size={20} />, color: 'var(--accent-amber)' },
            { label: 'Resolved',   value: stats.settled, icon: <CheckCircle size={20} />, color: 'var(--accent-green)' },
            { label: 'Users',       value: stats.users, icon: <Users size={20} />, color: 'var(--accent-violet)' },
          ].map(s => (
            <div key={s.label} className="card stat-card fade-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-value">{s.value}</div>
                <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[['cases','Cases Overview'], ['users','User Management']].map(([t, label]) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setTab(t)}
            >
              {t === 'cases' ? <Scale size={14} /> : <Users size={14} />}
              {label}
            </button>
          ))}
        </div>

        {/* ── CASES TAB ── */}
        {tab === 'cases' && (
          <div className="card fade-up">
            <div className="card-body">
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: '2.4rem', marginBottom: 0 }}
                    placeholder="Search by title, claimant, respondent…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                  <select
                    className="form-control"
                    style={{ padding: '0.6rem 0.9rem', minWidth: 140, marginBottom: 0 }}
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map(s => (
                      <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>}

              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Scale size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                  <p>No cases match your filter.</p>
                </div>
              )}

              {!loading && filtered.map(c => {
                const s = STATUS_STYLES[c.status] || { cls: 'badge-muted', label: c.status }
                return (
                  <div key={c._id} style={{
                    padding: '1rem 1.1rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', marginBottom: '0.65rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)',
                    transition: 'border-color var(--transition)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {c.claimantName} vs. {c.respondentName} &bull; {c.disputeType}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                      <Link to={`/disputes/${c._id}`} className="btn btn-ghost btn-sm" title="Inspect full case details and evidence">
                        <Eye size={14} /> View <ChevronRight size={13} />
                      </Link>
                      {c.status !== 'solved' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            if (!window.confirm(`Mark "${c.title}" as resolved/solved?`)) return
                            try {
                              await axios.patch(`${API}/cases/${c._id}/solve`)
                              setCases(prev => prev.map(item => item._id === c._id ? { ...item, status: 'solved' } : item))
                            } catch (err) {
                              alert('Failed to mark as solved: ' + (err.response?.data?.message || err.message))
                            }
                          }}
                          style={{ color: '#4ade80' }}
                          title="Mark case as solved"
                        >
                          <CheckCircle size={14} /> Mark Solved
                        </button>
                      )}
                      <button
                        id={`delete-case-${c._id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteCase(c._id, c.title)}
                        disabled={deleting === c._id}
                      >
                        {deleting === c._id ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Trash2 size={14} />}
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="card fade-up">
            <div className="card-body">
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={17} style={{ color: 'var(--accent-violet)' }} /> Registered Users
              </h2>

              {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>}

              {!loading && users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</div>
              )}

              {!loading && users.map(u => (
                <div key={u._id} style={{
                  padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', marginBottom: '0.6rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: u.role === 'admin' ? 'linear-gradient(135deg,#ef4444,#8b5cf6)' : 'var(--gradient-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'mediator' ? 'badge-violet' : 'badge-blue'}`}>
                      {u.role}
                    </span>
                    {u._id !== user?._id && (
                      <button
                        id={`delete-user-${u._id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(u._id, u.name)}
                        disabled={deleting === u._id}
                      >
                        {deleting === u._id ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Trash2 size={13} />}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
