import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  User, FilePlus, Folders, CheckCircle, Clock, AlertCircle,
  Scale, TrendingUp, Eye, ChevronRight
} from 'lucide-react'

import { NODE_API_BASE as API, PYTHON_API_BASE as PYTHON_API } from '../config/api'

import { useRealtimeEvents } from '../context/useRealtimeEvents'
import { Activity, Bell, X } from 'lucide-react'

const STATUS_STYLES = {
  draft:            { cls: 'badge-muted',  label: 'Draft' },
  invited:          { cls: 'badge-blue',   label: 'Invited' },
  accepted:         { cls: 'badge-cyan',   label: 'Accepted' },
  submissions_open: { cls: 'badge-amber',  label: 'Open' },
  submissions_closed:{ cls:'badge-violet', label: 'Closed' },
  ai_evaluation:    { cls: 'badge-violet', label: 'AI Analysis' },
  decision_issued:  { cls: 'badge-blue',   label: 'Decision Issued' },
  settled_accepted: { cls: 'badge-green',  label: '✓ Settled' },
  appealed_mediator:{ cls: 'badge-red',    label: 'Appealed' },
  solved:           { cls: 'badge-green',  label: '✓ Solved' },
}

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [cases, setCases]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [marking, setMarking] = useState(null) // case id being marked
  const [lastEventTime, setLastEventTime] = useState(null)

  const isRespondent = user?.role === 'respondent'

  const fetchCases = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    if (isRespondent) {
      // Respondents: fetch from Python disputes API and filter by their email
      try {
        const r = await axios.get(`${PYTHON_API}/disputes`)
        const userEmail = user?.email?.toLowerCase()
        const mine = r.data.filter(d =>
          d.party_b_email?.toLowerCase() === userEmail
        )
        const normalised = mine.map(d => ({
          _id: d.id,
          title: d.title,
          status: d.status,
          disputeType: d.category || 'Civil Dispute',
          respondentName: d.party_a_name || 'Claimant',
          createdAt: d.created_at,
          _pythonDispute: true
        }))
        setCases(normalised)
        setError('')
      } catch {
        if (!isBackground) setError('Failed to load your assigned cases.')
      } finally {
        if (!isBackground) setLoading(false)
      }
    } else {
      // Claimants: fetch from Node.js cases API
      try {
        const r = await axios.get(`${API}/cases`)
        const mine = r.data.filter(c =>
          c.claimantEmail?.toLowerCase() === user?.email?.toLowerCase() ||
          c.claimant === user?._id || c.claimant?._id === user?._id
        )
        setCases(mine)
        setError('')
      } catch {
        if (!isBackground) setError('Failed to load your cases.')
      } finally {
        if (!isBackground) setLoading(false)
      }
    }
  }

  // Initial load
  useEffect(() => {
    fetchCases(false)
  }, [user])

  // Hook into real-time server events (SSE)
  const { isConnected, lastNotification, dismissNotification } = useRealtimeEvents(() => {
    // Whenever an event fires, refresh dashboard data seamlessly
    fetchCases(true)
    setLastEventTime(new Date())
  })

  const markSolved = async (caseId) => {
    setMarking(caseId)
    try {
      await axios.patch(`${API}/cases/${caseId}/solve`)
      setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: 'solved' } : c))
    } catch {
      alert('Could not mark as solved. Please try again.')
    } finally {
      setMarking(null)
    }
  }

  const stats = {
    total:   cases.length,
    active:  cases.filter(c => !['settled_accepted','solved','appealed_mediator'].includes(c.status)).length,
    settled: cases.filter(c => ['settled_accepted','solved'].includes(c.status)).length,
  }

  return (
    <div className="page-content">
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.35)'
            }}>
              <User size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
                My Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span>{user?.name} &bull;</span>
                <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{user?.role}</span>
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
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => fetchCases(false)}
              className="btn btn-ghost btn-sm"
              title="Manual Refresh"
            >
              Refresh
            </button>
            <Link to="/disputes/new" className="btn btn-primary">
              <FilePlus size={16} /> File New Dispute
            </Link>
          </div>
        </div>

        {/* Live Event Notification Banner */}
        {lastNotification && (
          <div className="alert alert-info fade-up" style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
            borderColor: 'rgba(99,179,237,0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Bell size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.88rem' }}>Live Update: </strong>
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
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Cases', value: stats.total, icon: <Folders size={22} />, color: 'var(--accent-blue)' },
            { label: 'Active Cases', value: stats.active, icon: <Clock size={22} />, color: 'var(--accent-amber)' },
            { label: 'Resolved',    value: stats.settled, icon: <CheckCircle size={22} />, color: 'var(--accent-green)' },
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

        {/* Cases List */}
        <div className="card fade-up delay-1">
          <div className="card-body">
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} style={{ color: 'var(--accent-blue)' }} /> My Cases
            </h2>

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner" />
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            {!loading && !error && cases.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Scale size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>You haven't filed any disputes yet.</p>
                <Link to="/disputes/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  <FilePlus size={16} /> File Your First Dispute
                </Link>
              </div>
            )}

            {!loading && cases.map(c => {
              const s = STATUS_STYLES[c.status] || { cls: 'badge-muted', label: c.status }
              const canMarkSolved = ['decision_issued', 'settled_accepted'].includes(c.status)
              return (
                <div key={c._id} style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginBottom: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem', flexWrap: 'wrap',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'border-color var(--transition)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      vs. {c.respondentName} &bull; {c.disputeType}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                    {canMarkSolved && c.status !== 'solved' && (
                      <button
                        id={`mark-solved-${c._id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => markSolved(c._id)}
                        disabled={marking === c._id}
                        style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                      >
                        {marking === c._id ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <CheckCircle size={14} />}
                        Mark Solved
                      </button>
                    )}
                    <Link to={`/disputes/${c._id}`} className="btn btn-ghost btn-sm">
                      <Eye size={14} /> View <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid-2" style={{ marginTop: '1.5rem', gap: '1rem' }}>
          <Link to="/disputes" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', textDecoration: 'none' }}>
            <Folders size={22} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>All Disputes</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browse the full dispute directory</div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
          </Link>
          <Link to="/cases" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', textDecoration: 'none' }}>
            <TrendingUp size={22} style={{ color: 'var(--accent-violet)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Reference Cases</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Explore legal precedents</div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
          </Link>
        </div>

      </div>
    </div>
  )
}
