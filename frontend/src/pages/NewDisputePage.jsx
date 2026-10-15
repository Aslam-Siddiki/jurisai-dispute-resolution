import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  FileText, User, UserPlus, Upload, Sparkles, AlertCircle,
  CheckCircle2, ArrowRight, Copy, Check, Mail, ExternalLink,
  Scale, Shield, HelpCircle, Eye
} from 'lucide-react'

import { PYTHON_API_BASE as API_BASE } from '../config/api'

const CATEGORIES = [
  'Tenancy & Security Deposit',
  'Freelance & Contract Breach',
  'Employment & Unpaid Wages',
  'Consumer Goods & E-Commerce',
  'Business Partnership Dispute',
  'Property Damage & Repairs',
  'Personal Loan & Debt Settlement',
  'Service Agreement & Quality',
  'Other Civil Dispute'
]

export default function NewDisputePage() {
  const navigate = useNavigate()

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')

  // Party A (Claimant)
  const [nameA, setNameA] = useState('')
  const [emailA, setEmailA] = useState('')
  const [statementA, setStatementA] = useState('')
  const [fileA, setFileA] = useState(null)

  // Party B (Respondent to invite)
  const [nameB, setNameB] = useState('')
  const [emailB, setEmailB] = useState('')
  const [sendEmail, setSendEmail] = useState(true)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [registeredResult, setRegisteredResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!title.trim() || !nameA.trim() || !statementA.trim() || !nameB.trim() || !emailB.trim()) {
      setError('Please fill in all required fields (Dispute title, your name & statement, Party B name & email).')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // 1. Register dispute and invite party B
      const res = await axios.post(`${API_BASE}/disputes/register`, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category,
        party_a_name: nameA.trim(),
        party_a_email: emailA.trim() || undefined,
        party_a_statement: statementA.trim(),
        party_b_name: nameB.trim(),
        party_b_email: emailB.trim(),
        send_email: sendEmail
      })

      const disputeId = res.data.dispute_id

      // 2. Upload Party A evidence file if attached
      if (fileA) {
        const formData = new FormData()
        formData.append('party_role', 'A')
        formData.append('file', fileA)
        await axios.post(`${API_BASE}/disputes/${disputeId}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setRegisteredResult(res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to register dispute and generate invitation.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!registeredResult?.invite_url) return
    navigator.clipboard.writeText(registeredResult.invite_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="container page-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="mb-3 text-center">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#60a5fa',
          padding: '0.35rem 0.85rem',
          borderRadius: '2rem',
          fontSize: '0.85rem',
          marginBottom: '0.75rem',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <Scale size={16} /> Online Civil Mediation System
        </div>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
          {registeredResult ? 'Case Registered & Invitation Sent' : 'Register Dispute & Invite Respondent'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          {registeredResult
            ? 'Party B has been issued an invitation link to submit their response and enter AI-assisted mediation.'
            : 'Enter your claim as the Claimant (Party A), designate the Respondent (Party B), and an invitation URL & email will be dispatched.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-3 fade-up">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 2: Registration Success & Invitation Dispatch Hub */}
      {registeredResult ? (
        <div className="fade-up">
          {/* Main Success Banner */}
          <div className="card card-body mb-3 text-center" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            padding: '2.5rem 2rem'
          }}>
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
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem', color: '#fff' }}>
              Dispute Case Successfully Created!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
              The case is now in <strong>Pending Party B</strong> status. As soon as Party B opens their invitation and submits their statement, AI analysis can formulate an objective settlement.
            </p>

            <div style={{ display: 'inline-flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="badge badge-blue">Case: {registeredResult.dispute?.title}</span>
              <span className="badge badge-purple">Respondent: {nameB} ({emailB})</span>
            </div>
          </div>

          {/* Invitation URL Box Card */}
          <div className="card card-body mb-3">
            <h3 style={{ fontSize: '1.15rem', color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} /> Party B Invitation Link
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Share this dedicated URL with <strong>{nameB}</strong> so they can view your claim, inspect evidence, and submit their response:
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.6rem 0.85rem',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem'
            }}>
              <input
                type="text"
                readOnly
                value={registeredResult.invite_url}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '0.92rem',
                  outline: 'none',
                  minWidth: '240px'
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-secondary btn-sm"
                style={{ minWidth: '110px', justifyContent: 'center' }}
              >
                {copied ? <><Check size={14} color="#34d399" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={registeredResult.invite_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <Eye size={14} /> Test Open as Party B <ExternalLink size={12} />
              </a>

              {registeredResult.email_status?.gmail_link && (
                <a
                  href={registeredResult.email_status.gmail_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ background: 'rgba(234, 67, 53, 0.15)', borderColor: '#ea4335', color: '#fca5a5' }}
                >
                  <Mail size={14} color="#ea4335" /> Open in Gmail
                </a>
              )}

              {registeredResult.email_status?.mailto_link && (
                <a
                  href={registeredResult.email_status.mailto_link}
                  className="btn btn-ghost btn-sm"
                >
                  <Mail size={14} /> Send via Default App
                </a>
              )}

              {registeredResult.email_status?.email_preview && (
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="btn btn-ghost btn-sm"
                >
                  {showEmailPreview ? 'Hide Email Preview' : 'View Email Preview'}
                </button>
              )}
            </div>

            {/* Email Preview Box */}
            {showEmailPreview && registeredResult.email_status?.email_preview && (
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Simulated Email Sent to: {registeredResult.email_status.recipient}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                  Subject: {registeredResult.email_status.subject}
                </div>
                <pre style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  lineHeight: 1.5
                }}>
                  {registeredResult.email_status.email_preview}
                </pre>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => {
                setRegisteredResult(null)
                setTitle('')
                setDescription('')
                setNameA('')
                setEmailA('')
                setStatementA('')
                setNameB('')
                setEmailB('')
                setFileA(null)
              }}
              className="btn btn-ghost"
            >
              Register Another Dispute
            </button>

            <Link
              to={`/disputes/${registeredResult.dispute_id}`}
              className="btn btn-primary btn-lg"
            >
              Go to Dispute Case Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      ) : (
        /* STEP 1: Registration Form */
        <form onSubmit={handleRegister} className="fade-up">
          {/* Section 1: Case Details */}
          <div className="card card-body mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <FileText size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>1. Case Information</h2>
            </div>

            <div className="grid-2 mb-2">
              <div className="form-group">
                <label className="form-label">Dispute Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Security Deposit Refund Claim — Flat 4B"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dispute Category *</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat} style={{ background: '#0d1626' }}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">High-Level Background / Summary (Optional)</label>
              <textarea
                className="form-control"
                placeholder="Brief summary of the context or contract underlying this disagreement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Section 2: Party A (Claimant / You) */}
          <div className="card card-body mb-3" style={{ borderColor: 'rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#60a5fa' }}>2. Your Information (Party A &mdash; Claimant)</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>You are initiating this civil dispute resolution case</p>
              </div>
            </div>

            <div className="grid-2 mb-2">
              <div className="form-group">
                <label className="form-label">Your Full Name or Business Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., John Smith (Tenant)"
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g., john.smith@example.com"
                  value={emailA}
                  onChange={(e) => setEmailA(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Detailed Claim Statement *</label>
              <textarea
                className="form-control"
                placeholder="Describe precisely what occurred, the amounts claimed, dates of events, breach of agreement, and what remedy you seek..."
                value={statementA}
                onChange={(e) => setStatementA(e.target.value)}
                rows={5}
                required
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>
                Tip: Clearly state numerical amounts (e.g. $1,200), timeline dates, and terms so the NLP pipeline can analyze them accurately.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Attach Supporting Evidence (Optional — PDF, Image, TXT)</label>
              <label
                className={`file-upload-zone${fileA ? ' has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) setFileA(dropped);
                }}
              >
                <input
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={(e) => setFileA(e.target.files[0])}
                />
                {fileA ? (
                  <div className="file-upload-selected">
                    <div className="file-upload-icon file-upload-icon--success">
                      <Upload size={20} />
                    </div>
                    <div className="file-upload-info">
                      <span className="file-upload-name">{fileA.name}</span>
                      <span className="file-upload-size">{(fileA.size / 1024).toFixed(1)} KB · Click to change</span>
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
          </div>

          {/* Section 3: Party B (Respondent to Invite) */}
          <div className="card card-body mb-3" style={{ borderColor: 'rgba(167, 139, 250, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#c084fc', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#c084fc' }}>3. Opposing Party to Invite (Party B &mdash; Respondent)</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>An invitation URL &amp; email notification will be generated for Party B</p>
              </div>
            </div>

            <div className="grid-2 mb-2">
              <div className="form-group">
                <label className="form-label">Party B Name / Organization *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Oakwood Properties LLC (Landlord)"
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Party B Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g., landlord@oakwoodproperties.com"
                  value={emailB}
                  onChange={(e) => setEmailB(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)'
            }}>
              <input
                type="checkbox"
                id="sendEmailCheck"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="sendEmailCheck" style={{ fontSize: '0.88rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Automatically dispatch invitation email with access link upon registration
              </label>
            </div>
          </div>

          {/* Submit Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/disputes" className="btn btn-ghost">Cancel</Link>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ minWidth: '260px', justifyContent: 'center' }}
            >
              {loading ? (
                <>Registering &amp; Generating Invite...</>
              ) : (
                <>Register Case &amp; Invite Party B <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
