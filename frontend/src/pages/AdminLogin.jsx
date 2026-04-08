import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const DEFAULT_EMAIL = 'admin@securepdfvault.com'
const DEFAULT_PASSWORD = 'Admin@2025'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const adminEmail = localStorage.getItem('admin_email') || DEFAULT_EMAIL
            const adminPassword = localStorage.getItem('admin_password') || DEFAULT_PASSWORD
            if (email.trim() === adminEmail && password === adminPassword) {
                localStorage.setItem('admin_token', 'admin-authenticated')
                toast.success('Welcome back, Admin!')
                navigate('/admin/dashboard')
            } else {
                toast.error('Invalid email or password.')
            }
        } catch {
            toast.error('Login failed. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md mb-3">
                        <ShieldCheck size={22} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to manage your vault</p>
                </div>

                <div className="card shadow-medium">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="label">Email address</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className="input-field pr-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPw(!showPw)}
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full justify-center py-2.5 mt-2"
                            disabled={loading}
                        >
                            <Lock size={15} />
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <div className="divider" />

                    <p className="text-center text-xs text-gray-400">
                        Admin access only · Unauthorized access is prohibited
                    </p>
                </div>


            </div>
        </div>
    )
}
