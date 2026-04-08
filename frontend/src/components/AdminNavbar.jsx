import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, Users, BarChart3, LogOut, FileText, Inbox, Moon, Sun, Settings } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const adminLinks = [
    { to: '/admin/dashboard', label: 'Files', icon: FileText },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/inbox', label: 'Inbox', icon: Inbox },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminNavbar() {
    const navigate = useNavigate()
    const { isDarkMode, toggleTheme } = useTheme()

    const handleLogout = () => {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
    }

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link to="/admin/dashboard" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <ShieldCheck size={15} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-[15px]">
                            SecureFiles<span className="text-indigo-600">Vault</span>
                            <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full align-middle">Admin</span>
                        </span>
                    </Link>

                    <nav className="hidden sm:flex items-center gap-0.5">
                        {adminLinks.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <Icon size={14} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors mr-2"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="btn-ghost text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            </div>
        </header>
    )
}
