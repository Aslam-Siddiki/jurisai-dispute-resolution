import { useState, useEffect } from 'react'
import axios from 'axios'
import { BookOpen, Search, Tag } from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

export default function ReferenceCasesPage() {
  const [cases, setCases] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axios.get(`${API_BASE}/cases/reference`)
        setCases(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch synthetic legal reference cases.')
      } finally {
        setLoading(false)
      }
    }
    fetchCases()
  }, [])

  const categories = ['All', ...new Set(cases.map(c => c.category))]

  const filtered = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.fact_summary.toLowerCase().includes(search.toLowerCase()) ||
                          c.resolution.toLowerCase().includes(search.toLowerCase())
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="container page-content">
      <div className="mb-3">
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={28} color="#a78bfa" /> Synthetic Precedent Case Knowledge Base
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          Historical civil dispute dataset indexed into FAISS vector space for similarity retrieval
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card card-body mb-3">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              className="form-control"
              style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
              placeholder="Search precedent cases by keywords, resolution, or facts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading reference precedent cases...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="grid-2">
          {filtered.map(c => (
            <div key={c.id} className="card card-body fade-up">
              <div className="flex justify-between items-center mb-1">
                <span className="badge badge-violet"><Tag size={12} /> {c.category}</span>
                <span className="text-xs text-secondary">Case #{c.id}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0 0.75rem', color: '#fff' }}>{c.title}</h3>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
                <span className="text-xs text-secondary font-bold">FACT SUMMARY:</span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                  {c.fact_summary}
                </p>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.06)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-xs font-bold" style={{ color: '#34d399' }}>RESOLUTION / SETTLEMENT PRECEDENT:</span>
                <p style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '0.25rem', lineHeight: 1.5 }}>
                  {c.resolution}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
