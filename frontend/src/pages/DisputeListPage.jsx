import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  Folders, Search, FilePlus, ArrowRight, CheckCircle2, Clock,
  Sparkles, AlertTriangle, Users, Mail, Copy, Check, ExternalLink
} from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

export default function DisputeListPage() {
  const [disputes, setDisputes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const fetchDisputes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/disputes`)
      setDisputes(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch disputes list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [])

  const filtered = disputes.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    (d.party_a_name && d.party_a_name.toLowerCase().includes(search.toLowerCase())) ||
    (d.party_b_name && d.party_b_name.toLowerCase().includes(search.toLowerCase())) ||
    (d.category && d.category.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case 'settled':
        return <span className="badge badge-green"><CheckCircle2 size={12} /> Settled</span>
      case 'complete':
        return <span className="badge badge-blue"><Sparkles size={12} /> Analysis Complete</span>
      case 'analyzing':
        return <span className="badge badge-amber"><Clock size={12} /> Analyzing...</span>
      case 'submitted':
        return <span className="badge badge-cyan"><Clock size={12} /> Statements Ready</span>
      default:
        return <span className="badge badge-amber"><Clock size={12} /> Awaiting Party B</span>
    }
  }

  const handleCopyInvite = (e, token, id) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <div className="container page-content">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Folders size={28} color="#60a5fa" /> Civil Disputes Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            View, track, and examine AI recommendations for all registered and mediated cases
          </p>
        </div>

        <Link to="/disputes/new" className="btn btn-primary">
          <FilePlus size={16} /> Register New Case &amp; Invite
        </Link>
      </div>

      {/* Search Input Bar */}
      <div className="card card-body mb-3" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={20} color="var(--text-secondary)" />
          <input
            type="text"
            className="form-control"
            style={{ border: 'none', background: 'transparent', padding: '0.25rem 0', boxShadow: 'none' }}
            placeholder="Search disputes by title, category, party names, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Fetching disputes registry...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="card card-body text-center" style={{ padding: '3rem 1rem' }}>
          <Folders size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No disputes found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {search ? 'No disputes match your search terms.' : 'There are no civil disputes registered yet.'}
          </p>
          <Link to="/disputes/new" className="btn btn-secondary">Register First Dispute</Link>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(d => (
            <div key={d.id} className="card card-body fade-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="text-xs text-secondary">ID: <code>{d.id.substring(0, 8)}...</code></span>
                    {d.category && <span className="badge badge-purple text-xs">{d.category}</span>}
                  </div>
                  {getStatusBadge(d.status)}
                </div>

                <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem', marginBottom: '0.75rem', color: '#fff' }}>
                  {d.title}
                </h3>

                {/* Parties row */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  border: '1px solid var(--border)',
                  fontSize: '0.86rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#60a5fa' }}>
                    <strong>Claimant:</strong> {d.party_a_name || 'Party A'}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>vs</div>
                  <div style={{ color: '#a78bfa' }}>
                    <strong>Respondent:</strong> {d.party_b_name || 'Party B'}
                  </div>
                </div>

                {d.description && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {d.description}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center mt-1 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span className="text-xs text-secondary">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {d.status === 'pending' && d.invite_token && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyInvite(e, d.invite_token, d.id)}
                      className="btn btn-ghost btn-sm"
                      title="Copy Party B Invite URL"
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem' }}
                    >
                      {copiedId === d.id ? <><Check size={12} color="#34d399" /> Link Copied</> : <><Copy size={12} /> Invite Link</>}
                    </button>
                  )}
                  <Link to={`/disputes/${d.id}`} className="btn btn-ghost btn-sm">
                    View Details <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
