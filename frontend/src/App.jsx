import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'

// Layout
import Navbar from './components/Navbar'
import AdminMessagePopup from './components/AdminMessagePopup'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UploadPage from './pages/UploadPage'
import AccessPage from './pages/AccessPage'
import UserDashboard from './pages/UserDashboard'

// Admin Pages (have their own AdminNavbar built in)
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import AdminInbox from './pages/AdminInbox'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import AdminSettings from './pages/AdminSettings'

// Public layout wrapper (Navbar, no footer)
function PublicLayout({ children }) {
    return (
        <>
            <Navbar />
            <AdminMessagePopup />
            <main>{children}</main>
        </>
    )
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return null

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) return null

    // If logged in already, don't let them hit login/register again
    if (user) {
        return <Navigate to="/upload" replace />
    }

    return children
}

function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: '#fff',
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.875rem',
                        boxShadow: '0 4px 16px 0 rgb(0 0 0 / 0.08)',
                    },
                }}
            />
            <Routes>
                {/* Public / Guest Routes */}
                <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
                <Route path="/login" element={<GuestRoute><PublicLayout><LoginPage /></PublicLayout></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><PublicLayout><RegisterPage /></PublicLayout></GuestRoute>} />

                {/* Protected User Routes */}
                <Route path="/upload" element={
                    <ProtectedRoute>
                        <PublicLayout><UploadPage /></PublicLayout>
                    </ProtectedRoute>
                } />
                <Route path="/access" element={
                    <ProtectedRoute>
                        <PublicLayout><AccessPage /></PublicLayout>
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <PublicLayout><UserDashboard /></PublicLayout>
                    </ProtectedRoute>
                } />

                {/* Admin Routes — AdminNavbar is included per-page, no shared wrapper */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/inbox" element={<AdminInbox />} />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />

                {/* Legacy redirect */}
                <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
                <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
