import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Scale, FilePlus, Folders, BookOpen, User, Shield, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout, isAdmin } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)', borderRadius: 0 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            background: 'var(--gradient-primary)', padding: '0.5rem', borderRadius: '0.6rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59,130,246,0.4)'
          }}>
            <Scale size={24} color="#fff" />
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.02em' }}>
            JurisAI
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Link to="/" className={`btn ${isActive('/') && location.pathname === '/' ? 'btn-secondary' : 'btn-ghost'} btn-sm`}>
            Home
          </Link>
          <Link to="/disputes/new" className={`btn ${isActive('/disputes/new') ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            <FilePlus size={15} /> Submit Dispute
          </Link>
          <Link to="/disputes" className={`btn ${isActive('/disputes') && !isActive('/disputes/new') ? 'btn-secondary' : 'btn-ghost'} btn-sm`}>
            <Folders size={15} /> All Disputes
          </Link>
          <Link to="/cases" className={`btn ${isActive('/cases') ? 'btn-secondary' : 'btn-ghost'} btn-sm`}>
            <BookOpen size={15} /> Reference Cases
          </Link>
        </nav>

        {/* Auth area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <>
              {/* Dashboard link */}
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className={`btn btn-sm ${isActive('/admin') || isActive('/dashboard') ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ gap: '0.4rem' }}
              >
                {isAdmin
                  ? <><Shield size={15} style={{ color: '#f87171' }} /> Admin</>
                  : <><LayoutDashboard size={15} /> Dashboard</>
                }
              </Link>

              {/* User pill / Settings link */}
              <Link
                to="/settings"
                title="Profile & Settings"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.55rem',
                  padding: '0.3rem 0.75rem 0.3rem 0.4rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.04)',
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg,#ef4444,#8b5cf6)' : 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff'
                }}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
              </Link>

              {/* Logout */}
              <button
                id="navbar-logout-btn"
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                title="Sign out"
                style={{ padding: '0.45rem 0.7rem' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`btn ${isActive('/login') ? 'btn-secondary' : 'btn-ghost'} btn-sm`}>
                <User size={15} /> Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}
