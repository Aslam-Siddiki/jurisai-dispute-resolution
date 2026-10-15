import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import {
  Sparkles, Layers, Cpu, Scale, ShieldAlert, BookOpen, FileCheck, CheckCircle2,
  XCircle, Clock, AlertTriangle, ArrowLeft, RefreshCw, ThumbsUp, ThumbsDown,
  Mail, Copy, Check, ExternalLink, Send, UserCheck
} from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

export default function DisputeDetailPage() {
  const { id } = useParams()
  const [dispute, setDispute] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('recommendation') // recommendation, reasoning, entities, contradictions, cases

  // Invitation Hub state
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [resendingInvite, setResendingInvite] = useState(false)
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState(null)

  // Fetch dispute and analysis details
  const fetchDetails = async () => {
    try {
      const dispRes = await axios.get(`${API_BASE}/disputes/${id}`)
      setDispute(dispRes.data)

      const anaRes = await axios.get(`${API_BASE}/disputes/${id}/analysis`)
      if (anaRes.data.analysis) {
        setAnalysisData(anaRes.data.analysis)
      }

      if (dispRes.data.status === 'analyzing') {
        setAnalyzing(true)
      } else {
        setAnalyzing(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to load dispute details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id])

  // Poll status while analyzing
  useEffect(() => {
    let interval = null
    if (analyzing) {
      interval = setInterval(() => {
        fetchDetails()
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [analyzing])

  // Trigger analysis if submitted and not started
  const handleTriggerAnalysis = async () => {
    setAnalyzing(true)
    try {
      await axios.post(`${API_BASE}/disputes/${id}/analyze`)
      fetchDetails()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to trigger AI analysis.')
      setAnalyzing(false)
    }
  }

  // Respond to recommendation (Accept/Reject)
  const handlePartyResponse = async (party, response) => {
    try {
      await axios.post(`${API_BASE}/disputes/${id}/respond`, { party, response })
      fetchDetails()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to submit party response.')
    }
  }

  // Resend or dispatch email invite to Party B
  const handleResendInvite = async () => {
    setResendingInvite(true)
    setInviteSuccessMsg(null)
    try {
      const partyB = dispute?.parties?.find(p => p.role === 'B')
      const res = await axios.post(`${API_BASE}/disputes/${id}/invite-party-b`, {
        party_b_email: partyB?.email,
        party_b_name: partyB?.name
      })
      setInviteSuccessMsg('Invitation email dispatched to Party B!')
      setTimeout(() => setInviteSuccessMsg(null), 4000)
      fetchDetails()
    } catch (err) {
      console.error(err)
      alert('Failed to resend invitation email.')
    } finally {
      setResendingInvite(false)
    }
  }

  const handleCopyInviteUrl = (url) => {
    navigator.clipboard.writeText(url)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2500)
  }

  if (loading) {
    return (
      <div className="container page-content text-center" style={{ padding: '6rem 0' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dispute record and AI pipeline state...</p>
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <div className="container page-content">
        <div className="alert alert-error mb-2">
          <AlertTriangle size={20} />
          <div>{error || 'Dispute record not found.'}</div>
        </div>
        <Link to="/disputes" className="btn btn-ghost"><ArrowLeft size={16} /> Back to Disputes</Link>
      </div>
    )
  }

  const partyA = dispute.parties.find(p => p.role === 'A')
  const partyB = dispute.parties.find(p => p.role === 'B')
  const inviteUrl = dispute.invite_token ? `${window.location.origin}/invite/${dispute.invite_token}` : ''
  const isPartyBPending = !partyB || !partyB.statement || !partyB.statement.trim()

  return (
    <div className="container page-content">
      {/* Top Header & Breadcrumbs */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <div>
          <Link to="/disputes" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Back to Disputes List
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '2rem' }}>{dispute.title}</h1>
            {dispute.category && <span className="badge badge-purple">{dispute.category}</span>}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Dispute ID: <code>{dispute.id}</code> &bull; Created {new Date(dispute.created_at).toLocaleString()}
          </div>
        </div>

        <div>
          {dispute.status === 'settled' && <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}><CheckCircle2 size={16} /> Settlement Accepted</span>}
          {dispute.status === 'complete' && <span className="badge badge-blue" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}><Sparkles size={16} /> Analysis Complete</span>}
          {dispute.status === 'analyzing' && <span className="badge badge-amber" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}><RefreshCw size={16} className="spinner" style={{ width: 14, height: 14 }} /> AI Pipeline Running...</span>}
          {dispute.status === 'submitted' && <span className="badge badge-cyan" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}><Clock size={16} /> Statements Submitted</span>}
          {dispute.status === 'pending' && <span className="badge badge-amber" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}><Clock size={16} /> Awaiting Party B</span>}
        </div>
      </div>

      {inviteSuccessMsg && (
        <div className="alert alert-success mb-2 fade-up">
          <CheckCircle2 size={18} />
          <div>{inviteSuccessMsg}</div>
        </div>
      )}

      {/* Party B Invitation Banner (When Party B is awaiting response) */}
      {isPartyBPending && (
        <div className="card card-body mb-3 fade-up" style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
          borderColor: 'rgba(167, 139, 250, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Mail size={18} color="#c084fc" />
                <h3 style={{ color: '#c084fc', fontSize: '1.15rem' }}>
                  Awaiting Party B (Respondent) Statement
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '640px' }}>
                Party B (<strong>{partyB?.name || 'Respondent'}</strong>{partyB?.email ? ` — ${partyB.email}` : ''}) has been invited. Once they submit their statement via the invitation link, the AI resolution pipeline can run.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {partyB?.email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(partyB.email)}&su=${encodeURIComponent(`Mediation Invitation: Dispute '${dispute?.title || ''}'`)}&body=${encodeURIComponent(`Hello ${partyB.name || 'Respondent'},\n\nYou have been invited to participate in digital mediation on JurisAI regarding: '${dispute?.title}'.\n\nPlease submit your statement and evidence here:\n${inviteUrl || ''}\n\nBest regards,\nJurisAI Mediation Platform`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ background: 'rgba(234, 67, 53, 0.15)', borderColor: '#ea4335', color: '#fca5a5' }}
                >
                  <Mail size={14} color="#ea4335" /> Open in Gmail
                </a>
              )}
              <button
                onClick={handleResendInvite}
                disabled={resendingInvite}
                className="btn btn-secondary btn-sm"
              >
                <Mail size={14} /> {resendingInvite ? 'Sending...' : 'Resend Email Invitation'}
              </button>
              {inviteUrl && (
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  <ExternalLink size={14} /> Open Party B Portal
                </a>
              )}
            </div>
          </div>

          {inviteUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              marginTop: '1rem',
              gap: '0.5rem',
              border: '1px solid var(--border)',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Invite URL:
              </span>
              <input
                type="text"
                readOnly
                value={inviteUrl}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#60a5fa',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
              <button
                type="button"
                onClick={() => handleCopyInviteUrl(inviteUrl)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
              >
                {copiedInvite ? <><Check size={12} color="#34d399" /> Copied</> : <><Copy size={12} /> Copy Link</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis Running Banner */}
      {analyzing && (
        <div className="card card-body mb-3 fade-up" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="spinner"></div>
            <div>
              <h3 style={{ color: '#fbbf24', fontSize: '1.1rem', marginBottom: '0.25rem' }}>AI Natural Language Pipeline Execution in Progress</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Executing Zero-Shot Classification, NER Fact Extraction, Sentence-BERT Similarity, DeBERTa NLI Contradiction Search, and FAISS Vector Match. This page auto-updates...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action to start analysis if ready */}
      {dispute.status === 'submitted' && !analysisData && !analyzing && (
        <div className="card card-body mb-3 fade-up" style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 style={{ color: '#60a5fa', fontSize: '1.15rem', marginBottom: '0.25rem' }}>Ready for AI Resolution Pipeline</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Both Party A and Party B statements are submitted. Click to execute full multi-stage NLP model stack.
              </p>
            </div>
            <button onClick={handleTriggerAnalysis} className="btn btn-primary btn-lg">
              <Sparkles size={18} /> Execute AI Analysis
            </button>
          </div>
        </div>
      )}

      {/* Party Statements Summary Cards */}
      <div className="grid-2 mb-3">
        <div className="card card-body">
          <div className="flex justify-between items-center mb-1">
            <h3 style={{ fontSize: '1.1rem', color: '#60a5fa' }}>Party A (Claimant)</h3>
            <span className="badge badge-blue">{partyA ? partyA.name : 'Unassigned'}</span>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {partyA?.statement || 'Statement pending submission.'}
          </p>
        </div>

        <div className="card card-body">
          <div className="flex justify-between items-center mb-1">
            <h3 style={{ fontSize: '1.1rem', color: '#a78bfa' }}>Party B (Respondent)</h3>
            <span className="badge badge-violet">{partyB ? partyB.name : 'Unassigned'}</span>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {partyB?.statement || 'Statement pending submission.'}
          </p>
        </div>
      </div>

      {/* AI Analysis Results Section */}
      {analysisData && (
        <div className="fade-up">
          {/* Quick Metrics Bar */}
          <div className="grid-3 mb-3">
            <div className="card stat-card">
              <span className="stat-label">Dispute Category</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Layers size={22} color="#38bdf8" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>{analysisData.dispute_category}</span>
              </div>
              <span className="text-xs text-secondary mt-1">
                Classifier Confidence: <strong>{(analysisData.classifier_confidence * 100).toFixed(1)}%</strong>
              </span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Semantic Similarity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Scale size={22} color="#a78bfa" />
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>
                  {(analysisData.similarity_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar-wrap mt-1">
                <div
                  className="progress-bar-fill progress-violet"
                  style={{ width: `${Math.round(analysisData.similarity_score * 100)}%` }}
                />
              </div>
            </div>

            <div className="card stat-card">
              <span className="stat-label">NLI Contradictions</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <ShieldAlert size={22} color={analysisData.nli_result?.summary?.contradictions_found > 0 ? '#f87171' : '#34d399'} />
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>
                  {analysisData.nli_result?.summary?.contradictions_found || 0} Conflict(s)
                </span>
              </div>
              <span className="text-xs text-secondary mt-1">
                {analysisData.nli_result?.summary?.supporting_found || 0} Supported Agreement Point(s)
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTab('recommendation')}
              className={`btn btn-sm ${activeTab === 'recommendation' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <FileCheck size={16} /> Settlement Proposal
            </button>
            <button
              onClick={() => setActiveTab('reasoning')}
              className={`btn btn-sm ${activeTab === 'reasoning' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Sparkles size={16} /> AI Explanation & Reasoning
            </button>
            <button
              onClick={() => setActiveTab('entities')}
              className={`btn btn-sm ${activeTab === 'entities' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Cpu size={16} /> Extracted Facts (NER)
            </button>
            <button
              onClick={() => setActiveTab('contradictions')}
              className={`btn btn-sm ${activeTab === 'contradictions' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <ShieldAlert size={16} /> Contradiction Analysis
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`btn btn-sm ${activeTab === 'cases' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <BookOpen size={16} /> Precedent Cases (FAISS)
            </button>
          </div>

          {/* Tab 1: Recommendation */}
          {activeTab === 'recommendation' && (
            <div className="card card-body fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCheck size={24} /> Recommended Settlement Proposal
                </h2>
                <span className="badge badge-green">Neutral AI Synthesis</span>
              </div>

              <div className="markdown-body" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <ReactMarkdown>{analysisData.recommendation}</ReactMarkdown>
              </div>

              {/* Interactive Party Acceptance Section */}
              <div className="divider" />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Party Acceptance & Non-Binding Resolution</h3>

              <div className="grid-2">
                {/* Party A Decision Box */}
                <div style={{ background: 'rgba(59,130,246,0.06)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 600, color: '#60a5fa' }}>Party A Response ({partyA?.name}):</span>
                    {analysisData.party_a_response === 'accept' && <span className="badge badge-green"><ThumbsUp size={12} /> Accepted</span>}
                    {analysisData.party_a_response === 'reject' && <span className="badge badge-red"><ThumbsDown size={12} /> Rejected</span>}
                    {!analysisData.party_a_response && <span className="badge badge-amber">Awaiting Decision</span>}
                  </div>
                  {!analysisData.party_a_response && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handlePartyResponse('A', 'accept')} className="btn btn-sm btn-primary">
                        <ThumbsUp size={14} /> Accept Proposal
                      </button>
                      <button onClick={() => handlePartyResponse('A', 'reject')} className="btn btn-sm btn-danger">
                        <ThumbsDown size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Party B Decision Box */}
                <div style={{ background: 'rgba(139,92,246,0.06)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 600, color: '#a78bfa' }}>Party B Response ({partyB?.name}):</span>
                    {analysisData.party_b_response === 'accept' && <span className="badge badge-green"><ThumbsUp size={12} /> Accepted</span>}
                    {analysisData.party_b_response === 'reject' && <span className="badge badge-red"><ThumbsDown size={12} /> Rejected</span>}
                    {!analysisData.party_b_response && <span className="badge badge-amber">Awaiting Decision</span>}
                  </div>
                  {!analysisData.party_b_response && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handlePartyResponse('B', 'accept')} className="btn btn-sm btn-primary">
                        <ThumbsUp size={14} /> Accept Proposal
                      </button>
                      <button onClick={() => handlePartyResponse('B', 'reject')} className="btn btn-sm btn-danger">
                        <ThumbsDown size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Explanation & AI Reasoning */}
          {activeTab === 'reasoning' && (
            <div className="card card-body fade-up">
              <h2 style={{ fontSize: '1.4rem', color: '#a78bfa', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={24} /> Step-by-Step AI Model Reasoning
              </h2>
              <div className="markdown-body" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <ReactMarkdown>{analysisData.explanation}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Tab 3: Extracted Facts (NER) */}
          {activeTab === 'entities' && (
            <div className="card card-body fade-up">
              <h2 style={{ fontSize: '1.4rem', color: '#22d3ee', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={24} /> Named Entity Recognition (NER) Findings
              </h2>

              <div className="grid-2">
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#60a5fa', marginBottom: '1rem' }}>Party A Entities</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span className="text-xs text-secondary">Monetary Amounts:</span>
                      <div className="mt-1">{analysisData.entities_a?.money?.map((m, i) => <span key={i} className="badge badge-green mr-1">{m}</span>) || 'None extracted'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-secondary">Dates Mentioned:</span>
                      <div className="mt-1">{analysisData.entities_a?.dates?.map((d, i) => <span key={i} className="badge badge-blue mr-1">{d}</span>) || 'None extracted'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-secondary">Deadlines / Terms:</span>
                      <div className="mt-1">{analysisData.entities_a?.deadlines?.map((dl, i) => <span key={i} className="badge badge-amber mr-1">{dl}</span>) || 'None extracted'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#a78bfa', marginBottom: '1rem' }}>Party B Entities</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span className="text-xs text-secondary">Monetary Amounts:</span>
                      <div className="mt-1">{analysisData.entities_b?.money?.map((m, i) => <span key={i} className="badge badge-green mr-1">{m}</span>) || 'None extracted'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-secondary">Dates Mentioned:</span>
                      <div className="mt-1">{analysisData.entities_b?.dates?.map((d, i) => <span key={i} className="badge badge-blue mr-1">{d}</span>) || 'None extracted'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-secondary">Deadlines / Terms:</span>
                      <div className="mt-1">{analysisData.entities_b?.deadlines?.map((dl, i) => <span key={i} className="badge badge-amber mr-1">{dl}</span>) || 'None extracted'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Contradiction Analysis */}
          {activeTab === 'contradictions' && (
            <div className="card card-body fade-up">
              <h2 style={{ fontSize: '1.4rem', color: '#f87171', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={24} /> Natural Language Inference Contradiction Map
              </h2>

              {analysisData.nli_result?.contradictions?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analysisData.nli_result.contradictions.map((item, idx) => (
                    <div key={idx} style={{ background: 'rgba(239,68,68,0.08)', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="badge badge-red"><XCircle size={12} /> Contradiction Detected</span>
                        <span className="text-xs text-secondary">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        <div style={{ color: '#60a5fa', marginBottom: '0.25rem' }}><strong>Party A Claim:</strong> "{item.sent_a}"</div>
                        <div style={{ color: '#a78bfa' }}><strong>Party B Response:</strong> "{item.sent_b}"</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-success">
                  <CheckCircle2 size={20} />
                  <div>No direct sentence-level factual contradictions detected between the party statements.</div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Similar Cases */}
          {activeTab === 'cases' && (
            <div className="card card-body fade-up">
              <h2 style={{ fontSize: '1.4rem', color: '#fbbf24', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={24} /> FAISS Precedent Case Matches
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysisData.similar_cases?.map((c, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="badge badge-amber">Case #{c.id} &bull; {c.category}</span>
                      <span className="text-xs text-secondary">Vector Similarity Match: <strong>{(c.similarity_score * 100).toFixed(1)}%</strong></span>
                    </div>
                    <div style={{ fontSize: '0.92rem', marginTop: '0.5rem', fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                      <strong>Past Resolution:</strong> {c.resolution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
