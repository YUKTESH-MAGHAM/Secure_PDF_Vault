import { Link, NavLink } from 'react-router-dom'
import { ShieldCheck, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const navLinks = [
    { to: '/upload', label: 'Upload' },
    { to: '/access', label: 'Access File' },
    { to: '/dashboard', label: 'My Files' },
    { to: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
    const { isDarkMode, toggleTheme } = useTheme()
    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                        <ShieldCheck size={15} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px] tracking-tight">
                        SecurePDF<span className="text-indigo-600">Vault</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="hidden sm:flex items-center gap-0.5">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <Link to="/admin/login" className="btn-ghost text-xs py-1.5 px-3">
                        Admin
                    </Link>
                    <Link to="/upload" className="btn-primary py-2 px-4 text-xs">
                        Upload PDF
                    </Link>
                </div>
            </div>
        </header>
    )
}
