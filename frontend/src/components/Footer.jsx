import { ShieldCheck, Github } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="border-t border-gray-800 bg-gray-950 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
                        <ShieldCheck size={14} className="text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">SecureFilesVault</span>
                    <span className="text-gray-600 text-sm ml-2">© 2025</span>
                </div>
                <p className="text-gray-500 text-sm text-center">
                    Share Files securely with time-limited access
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <Link to="/upload" className="hover:text-gray-300 transition-colors">Upload</Link>
                    <Link to="/access" className="hover:text-gray-300 transition-colors">Access</Link>
                    <Link to="/admin" className="hover:text-gray-300 transition-colors">Admin</Link>
                </div>
            </div>
        </footer>
    )
}
