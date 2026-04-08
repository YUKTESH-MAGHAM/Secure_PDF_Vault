import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminNavbar from '../components/AdminNavbar'
import toast from 'react-hot-toast'
import { ShieldCheck, Eye, EyeOff, Save, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

const DEFAULT_EMAIL = 'admin@securepdfvault.com'
const DEFAULT_PASSWORD = 'Admin@2025'

function useAdminAuth() {
    const navigate = useNavigate()
    useEffect(() => {
        if (!localStorage.getItem('admin_token')) navigate('/admin/login')
    }, [])
}

export default function AdminSettings() {
    useAdminAuth()

    // Load stored creds or fall back to defaults
    const storedEmail = localStorage.getItem('admin_email') || DEFAULT_EMAIL
    const storedPassword = localStorage.getItem('admin_password') || DEFAULT_PASSWORD

    const [email, setEmail] = useState(storedEmail)
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleSave = (e) => {
        e.preventDefault()
        setSaving(true)

        // Validate current password
        if (currentPw !== storedPassword) {
            toast.error('Current password is incorrect.')
            setSaving(false)
            return
        }

        // Validate email
        if (!email.trim() || !email.includes('@')) {
            toast.error('Enter a valid email.')
            setSaving(false)
            return
        }

        // If changing password, validate new password
        if (newPw) {
            if (newPw.length < 6) {
                toast.error('New password must be at least 6 characters.')
                setSaving(false)
                return
            }
            if (newPw !== confirmPw) {
                toast.error('New passwords do not match.')
                setSaving(false)
                return
            }
        }

        // Save to localStorage
        localStorage.setItem('admin_email', email.trim())
        localStorage.setItem('admin_password', newPw || storedPassword)

        toast.success('Admin credentials updated! Use new credentials next time you log in.')
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar />
            <div className="max-w-xl mx-auto px-4 py-10 animate-fade-in">

                <div className="mb-6">
                    <h1 className="section-title">Admin Settings</h1>
                    <p className="section-sub">Update your admin login email and password</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3 mb-6">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700">
                        Credentials are stored locally on this browser. After changing, use the new credentials to log back in.
                        <br /><span className="font-semibold">Current: {storedEmail}</span>
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <form onSubmit={handleSave} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="label">Admin Email</label>
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Current Password (required to make any changes) */}
                        <div>
                            <label className="label">Current Password <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    className="input-field pr-10"
                                    placeholder="Confirm your current password"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <hr className="border-gray-100" />
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Change Password (optional)</p>

                        {/* New Password */}
                        <div>
                            <label className="label">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    className="input-field pr-10"
                                    placeholder="Leave blank to keep current"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="label">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    className="input-field pr-10"
                                    placeholder="Repeat new password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-2.5">
                            <Save size={14} />
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
