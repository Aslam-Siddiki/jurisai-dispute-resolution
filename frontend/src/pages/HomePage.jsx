import { Link } from 'react-router-dom'
import { Scale, Clock, Handshake, ArrowRight, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container page-content">
      {/* ── Minimal Hero Section ── */}
      <section style={{ textAlign: 'center', padding: '4rem 1rem 3rem' }} className="fade-up">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }} className="badge badge-blue">
          <Sparkles size={14} /> Digital ADR Platform
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          Resolve Disputes{' '}
          <span style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Fast & Fairly
          </span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 2.25rem', lineHeight: 1.65 }}>
          Submit your case, invite the other party, and receive an objective settlement proposal — no court required.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/disputes/new" className="btn btn-primary btn-lg">
            Start a Dispute <ArrowRight size={18} />
          </Link>
          <Link to="/disputes" className="btn btn-secondary btn-lg">
            View Disputes
          </Link>
        </div>
      </section>

      {/* ── Minimal Highlights ── */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="grid-3">
          <div className="card card-body text-center fade-up delay-1" style={{ padding: '1.5rem 1.25rem' }}>
            <div style={{ color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Scale size={30} />
            </div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>Impartial & Bilateral</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              Equal hearing for both parties with neutral AI analysis.
            </p>
          </div>

          <div className="card card-body text-center fade-up delay-2" style={{ padding: '1.5rem 1.25rem' }}>
            <div style={{ color: '#34d399', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Clock size={30} />
            </div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>Settlement in Minutes</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              Concrete compromise proposals — not months in court.
            </p>
          </div>

          <div className="card card-body text-center fade-up delay-3" style={{ padding: '1.5rem 1.25rem' }}>
            <div style={{ color: '#a78bfa', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Handshake size={30} />
            </div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>Mutual Agreement</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              Both parties vote to formally accept the settlement terms.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
