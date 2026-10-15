import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, KeyRound, UserX, AlertCircle, CheckCircle, ArrowLeft, Lock, Trash2, LogOut } from 'lucide-react'

export default function ProfileSettingsPage() {
  const { user, changePassword, deleteAccount, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete Account state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess('Your password has been updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (deleteConfirmText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }

    setDeleteLoading(true)
    try {
      await deleteAccount(deletePassword)
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '780px' }}>

        {/* Back navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn-ghost btn-sm" style={{ gap: '0.4rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Account Header */}
        <div className="card glass" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: isAdmin ? 'linear-gradient(135deg,#ef4444,#8b5cf6)' : 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: '#fff',
                boxShadow: '0 0 20px rgba(59,130,246,0.3)'
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                  {user?.name}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  {user?.email} • <span style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{user?.role}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/', { replace: true }) }}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.45rem' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card glass" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <KeyRound size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Change Password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ensure your account stays secure with a strong password.</p>
            </div>
          </div>

          {passwordSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.85rem 1rem', borderRadius: '0.5rem',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80', fontSize: '0.88rem', marginBottom: '1.25rem'
            }}>
              <CheckCircle size={18} /> {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.85rem 1rem', borderRadius: '0.5rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '0.88rem', marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} /> {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Current Password
              </label>
              <input
                type="password"
                className="form-control"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={passwordLoading}
              style={{ gap: '0.5rem' }}
            >
              <Lock size={16} /> {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="card glass" style={{ borderColor: 'rgba(239,68,68,0.3)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <UserX size={22} style={{ color: '#ef4444' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>Danger Zone</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Permanently delete your JurisAI user account and session data.
              </p>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Once you delete your account, there is no going back. All profile associations will be irreversibly removed.
          </p>

          {!showDeleteModal ? (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
              style={{ gap: '0.45rem' }}
            >
              <Trash2 size={16} /> Delete Account
            </button>
          ) : (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f87171', marginBottom: '0.75rem' }}>
                Are you absolutely sure?
              </h3>

              {deleteError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem'
                }}>
                  <AlertCircle size={16} /> {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Enter your account password:
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm"
                    disabled={deleteLoading}
                    style={{ gap: '0.45rem' }}
                  >
                    <Trash2 size={15} /> {deleteLoading ? 'Deleting...' : 'Confirm Account Deletion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeleteError(''); setDeletePassword(''); setDeleteConfirmText('') }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
