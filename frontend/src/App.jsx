import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import HomePage             from './pages/HomePage'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import UserDashboardPage    from './pages/UserDashboardPage'
import AdminDashboardPage   from './pages/AdminDashboardPage'
import NewDisputePage       from './pages/NewDisputePage'
import DisputeDetailPage    from './pages/DisputeDetailPage'
import DisputeListPage      from './pages/DisputeListPage'
import ReferenceCasesPage   from './pages/ReferenceCasesPage'
import PartyBInvitePage     from './pages/PartyBInvitePage'
import ProfileSettingsPage  from './pages/ProfileSettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<HomePage />} />
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />
            <Route path="/invite/:token" element={<PartyBInvitePage />} />
            <Route path="/cases"         element={<ReferenceCasesPage />} />

            {/* Protected — any authenticated user */}
            <Route path="/dashboard" element={
              <ProtectedRoute><UserDashboardPage /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>
            } />
            <Route path="/disputes" element={
              <ProtectedRoute><DisputeListPage /></ProtectedRoute>
            } />
            <Route path="/disputes/new" element={
              <ProtectedRoute><NewDisputePage /></ProtectedRoute>
            } />
            <Route path="/disputes/:id" element={
              <ProtectedRoute><DisputeDetailPage /></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
