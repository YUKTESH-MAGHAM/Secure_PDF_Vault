import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllFiles, deleteFile } from '../services/api'
import Spinner from '../components/Spinner'
import AdminNavbar from '../components/AdminNavbar'
import toast from 'react-hot-toast'
import { Trash2, ExternalLink, RefreshCw, FileText, ShieldOff, Eye, EyeOff, Key } from 'lucide-react'

// ── Auth Guard ─────────────────────────────────────────────────────────────
function useAdminAuth() {
    const navigate = useNavigate()
    useEffect(() => {
        if (!localStorage.getItem('admin_token')) navigate('/admin/login')
    }, [])
}

// ── Helper ──────────────────────────────────────────────────────────────────
function expiryBadge(expiresAt) {
    if (!expiresAt) return <span className="badge-blue">Never</span>
    return new Date() > new Date(expiresAt)
        ? <span className="badge-red">Expired</span>
        : <span className="badge-green">{new Date(expiresAt).toLocaleDateString()}</span>
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
    useAdminAuth()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState(null)
    const [filterEmail, setFilterEmail] = useState('All')
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
    const [revealedKeys, setRevealedKeys] = useState({})

    const toggleKeyReveal = (id) => setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }))

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    }

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const fetchFiles = async () => {
        setLoading(true)
        try {
            const res = await getAllFiles()
            setFiles(res.data.files)
        } catch { toast.error('Failed to fetch files.') }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchFiles() }, [])

    const handleDelete = async (id, pdfId) => {
        if (!window.confirm(`Permanently delete ${pdfId}?`)) return
        setDeletingId(id)
        try {
            await deleteFile(id)
            toast.success(`${pdfId} deleted.`)
            setFiles(prev => prev.filter(f => f.id !== id))
        } catch { toast.error('Delete failed.') }
        finally { setDeletingId(null) }
    }

    const stats = [
        { label: 'Total Files', value: files.length },
        { label: 'Active', value: files.filter(f => !f.expires_at || new Date() < new Date(f.expires_at)).length },
        { label: 'Expired', value: files.filter(f => f.expires_at && new Date() > new Date(f.expires_at)).length },
        { label: 'Total Storage', value: formatSize(files.reduce((sum, f) => sum + (f.file_size || 0), 0)) },
    ]

    const uniqueEmails = ['All', ...new Set(files.map(f => f.vault_users?.email).filter(Boolean))]

    const processedFiles = [...files]
        .filter(f => filterEmail === 'All' || f.vault_users?.email === filterEmail)
        .sort((a, b) => {
            if (sortConfig.key === 'file_size') {
                return sortConfig.direction === 'asc'
                    ? (a.file_size || 0) - (b.file_size || 0)
                    : (b.file_size || 0) - (a.file_size || 0);
            }
            if (sortConfig.key === 'created_at') {
                return sortConfig.direction === 'asc'
                    ? new Date(a.created_at) - new Date(b.created_at)
                    : new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
        });

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="section-title">All Files</h1>
                        <p className="section-sub">Manage uploaded PDFs and their access credentials</p>
                    </div>
                    <button onClick={fetchFiles} className="btn-secondary gap-2" disabled={loading}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
                    {stats.map(s => (
                        <div key={s.label} className="stat-card">
                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={15} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">Files</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">Filter by User:</span>
                            <select
                                className="border border-gray-200 rounded p-1 outline-none focus:border-indigo-500"
                                value={filterEmail}
                                onChange={(e) => setFilterEmail(e.target.value)}
                            >
                                {uniqueEmails.map(email => (
                                    <option key={email} value={email}>{email}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8"><Spinner /></div>
                    ) : files.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <ShieldOff size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No files uploaded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                                        <th className="px-5 py-3 font-medium">User & PDF ID</th>
                                        <th className="px-5 py-3 font-medium"><span className="flex items-center gap-1"><Key size={11} /> Secret Key</span></th>
                                        <th className="px-5 py-3 font-medium cursor-pointer hover:text-indigo-600" onClick={() => handleSort('file_size')}>
                                            Size {sortConfig.key === 'file_size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-5 py-3 font-medium cursor-pointer hover:text-indigo-600" onClick={() => handleSort('created_at')}>
                                            Uploaded {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-5 py-3 font-medium">Expiry</th>
                                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {processedFiles.map(file => (
                                        <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-indigo-600 text-sm">{file.pdf_id}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{file.vault_users?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`font-mono text-xs ${revealedKeys[file.id] ? 'text-gray-800' : 'text-gray-300 tracking-widest select-none'}`}>
                                                        {revealedKeys[file.id] ? file.secret_key : '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleKeyReveal(file.id)}
                                                        className="text-gray-400 hover:text-indigo-500 transition-colors"
                                                        title={revealedKeys[file.id] ? 'Hide' : 'Reveal secret key'}
                                                    >
                                                        {revealedKeys[file.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-600 font-medium">
                                                {formatSize(file.file_size)}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(file.created_at).toLocaleString()}</td>
                                            <td className="px-5 py-3.5">{expiryBadge(file.expires_at)}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => handleDelete(file.id, file.pdf_id)}
                                                    disabled={deletingId === file.id}
                                                >
                                                    {deletingId === file.id
                                                        ? <RefreshCw size={12} className="animate-spin" />
                                                        : <Trash2 size={12} />}
                                                    {deletingId === file.id ? 'Deleting…' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
