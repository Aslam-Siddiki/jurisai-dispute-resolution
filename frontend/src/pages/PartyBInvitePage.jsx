import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Scale, UserCheck, ShieldAlert, Sparkles, CheckCircle2,
  AlertCircle, Upload, ArrowRight, FileText, Clock, Mail,
  Check, FileCheck, Layers
} from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

export default function PartyBInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [disputeData, setDisputeData] = useState(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [statement, setStatement] = useState('')
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  // Fetch dispute information using invite token
  const fetchInviteInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${API_BASE}/disputes/invite/${token}`)
      setDisputeData(res.data)
      if (res.data.party_b) {
        setName(res.data.party_b.name || '')
        setEmail(res.data.party_b.email || '')
      }
      if (res.data.has_responded) {
        setSubmitted(true)
        if (res.data.party_b?.statement) {
          setStatement(res.data.party_b.statement)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Invalid or expired dispute invitation link.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchInviteInfo()
    }
  }, [token])

  // Submit response
  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    if (!statement.trim()) {
      setError('Please provide your response statement.')
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      // 1. Submit Statement
      await axios.post(`${API_BASE}/disputes/invite/${token}/respond`, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        statement: statement.trim()
      })

      // 2. Upload Evidence if selected
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        await axios.post(`${API_BASE}/disputes/invite/${token}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to submit response statement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container page-content text-center" style={{ padding: '6rem 0' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dispute invitation details...</p>
      </div>
    )
  }

  if (error && !disputeData) {
    return (
      <div className="container page-content" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="card card-body text-center fade-up" style={{ padding: '3.5rem 2rem' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Invitation Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            {error || 'This invitation link may be invalid, expired, or the dispute might have been removed.'}
          </p>
          <Link to="/" className="btn btn-primary">Return to Homepage</Link>
        </div>
      </div>
    )
  }

  const { title, description, category, created_at, party_a, party_b, dispute_id, evidence_files } = disputeData || {}

  return (
    <div className="container page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div className="card card-body mb-3 fade-up" style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
        borderColor: 'rgba(99, 179, 237, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--gradient-primary)',
            color: '#fff',
            padding: '0.9rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Scale size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Mediation Invitation</span>
              {category && <span className="badge badge-purple">{category}</span>}
              <span className="badge badge-muted">Case ID: {dispute_id?.substring(0, 8)}...</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              You were invited by <strong>{party_a?.name || 'Party A'}</strong> to participate in fair, AI-assisted civil mediation.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-2">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Case Background & Party A Claim */}
      <div className="card card-body mb-3 fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="#60a5fa" />
            <h3 style={{ fontSize: '1.15rem', color: '#60a5fa' }}>Claimant's Account (Party A: {party_a?.name})</h3>
          </div>
          {party_a?.email && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> {party_a.email}
            </span>
          )}
        </div>

        {description && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>Case Overview:</strong> {description}
          </div>
        )}

        <div style={{
          background: 'rgba(59, 130, 246, 0.04)',
          borderLeft: '4px solid var(--accent-blue)',
          padding: '1.25rem',
          borderRadius: '0.5rem',
          fontSize: '0.95rem',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.7
        }}>
          {party_a?.statement || 'No formal statement submitted yet.'}
        </div>

        {evidence_files && evidence_files.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Supporting Evidence Uploaded by Claimant:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {evidence_files.map((file, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.04)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid var(--border)'
                }}>
                  <FileText size={16} color="#60a5fa" />
                  <span>{file.original_filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Response Section */}
      {submitted ? (
        <div className="card card-body fade-up text-center" style={{ padding: '3rem 2rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Statement Successfully Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
            Both statements from Party A and Party B are now registered. The case is ready for the multi-stage AI resolution pipeline to evaluate factual claims, extract legal entities, and formulate settlement options.
          </p>

          <div style={{
            background: 'var(--bg-surface)',
            textAlign: 'left',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            maxWidth: '680px',
            margin: '0 auto 2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a78bfa' }}>Your Submitted Response ({name})</strong>
              <span className="badge badge-green"><Check size={12} /> Registered</span>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {statement}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={`/disputes/${dispute_id}`} className="btn btn-primary btn-lg">
              <Sparkles size={20} /> Open Dispute Resolution &amp; AI Analysis Dashboard
            </Link>
            <Link to="/disputes" className="btn btn-ghost">
              View All Disputes
            </Link>
          </div>
        </div>
      ) : (
        <div className="card card-body fade-up" style={{ borderColor: 'rgba(167, 139, 250, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#c084fc', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <FileCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', color: '#fff' }}>Your Response &amp; Defense (Party B)</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Provide your side of the dispute, clarifications, and any supporting documentation
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitResponse}>
            <div className="grid-2 mb-2">
              <div className="form-group">
                <label className="form-label">Your Name / Organization *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Alex Rivers (Landlord)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g., alex.rivers@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Formal Statement / Rebuttal *</label>
              <textarea
                className="form-control"
                placeholder="Detail your account of the situation, explain any deductions, payment dates, contractual clauses, or counter-proposals..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={6}
                required
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>
                Tip: Include specific dates, amounts, receipts, or agreed terms so the AI model can extract factual overlap.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Supporting Evidence File (Optional — PDF, Image, TXT)</label>
              <label
                className={`file-upload-zone${file ? ' has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) setFile(dropped);
                }}
              >
                <input
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                {file ? (
                  <div className="file-upload-selected">
                    <div className="file-upload-icon file-upload-icon--success">
                      <Upload size={20} />
                    </div>
                    <div className="file-upload-info">
                      <span className="file-upload-name">{file.name}</span>
                      <span className="file-upload-size">{(file.size / 1024).toFixed(1)} KB · Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-prompt">
                    <div className="file-upload-icon">
                      <Upload size={22} />
                    </div>
                    <div className="file-upload-text">
                      <span className="file-upload-title">Drop file here or <span className="file-upload-link">browse</span></span>
                      <span className="file-upload-hint">PDF, PNG, JPG, or TXT · Max 10 MB</span>
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Clock size={16} />
                <span>By submitting, this statement will be entered into the dispute record for objective AI evaluation.</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
              style={{ justifyContent: 'center' }}
            >
              {submitting ? (
                <>Submitting Response...</>
              ) : (
                <>Submit Statement &amp; Enter AI Mediation <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
