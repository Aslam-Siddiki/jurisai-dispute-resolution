import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Scale, FilePlus, Folders, BookOpen, User, Shield, LogOut, LayoutDashboard, Menu, X, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate('/', { replace: true })
  }

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="glass navbar-header" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)', borderRadius: 0 }}>
      <div className="container navbar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>

        {/* Logo */}
        <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
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

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

        {/* Desktop Auth area */}
        <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

        {/* Mobile menu toggle button */}
        <button
          className="btn btn-ghost btn-sm mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
          style={{ padding: '0.5rem', display: 'none' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu" style={{
          background: 'rgba(13, 22, 38, 0.98)',
          borderBottom: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backdropFilter: 'blur(20px)'
        }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isAdmin ? 'linear-gradient(135deg,#ef4444,#8b5cf6)' : 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 700, color: '#fff'
              }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
              </div>
            </div>
          )}

          <Link to="/" onClick={closeMenu} className={`btn ${isActive('/') && location.pathname === '/' ? 'btn-secondary' : 'btn-ghost'} btn-sm`} style={{ justifyContent: 'flex-start' }}>
            Home
          </Link>
          <Link to="/disputes/new" onClick={closeMenu} className={`btn ${isActive('/disputes/new') ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ justifyContent: 'flex-start' }}>
            <FilePlus size={16} /> Submit Dispute
          </Link>
          <Link to="/disputes" onClick={closeMenu} className={`btn ${isActive('/disputes') && !isActive('/disputes/new') ? 'btn-secondary' : 'btn-ghost'} btn-sm`} style={{ justifyContent: 'flex-start' }}>
            <Folders size={16} /> All Disputes
          </Link>
          <Link to="/cases" onClick={closeMenu} className={`btn ${isActive('/cases') ? 'btn-secondary' : 'btn-ghost'} btn-sm`} style={{ justifyContent: 'flex-start' }}>
            <BookOpen size={16} /> Reference Cases
          </Link>

          {user ? (
            <>
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                onClick={closeMenu}
                className={`btn btn-sm ${isActive('/admin') || isActive('/dashboard') ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', gap: '0.5rem' }}
              >
                {isAdmin ? <><Shield size={16} style={{ color: '#f87171' }} /> Admin Dashboard</> : <><LayoutDashboard size={16} /> User Dashboard</>}
              </Link>

              <Link
                to="/settings"
                onClick={closeMenu}
                className={`btn btn-sm ${isActive('/settings') ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', gap: '0.5rem' }}
              >
                <Settings size={16} /> Profile & Settings
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', gap: '0.5rem', color: '#f87171' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <Link to="/login" onClick={closeMenu} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
                <User size={15} /> Sign In
              </Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
