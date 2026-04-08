import { useState, useEffect } from 'react'
import { getMyFiles, deleteFile, sendMessageToAdmin } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { Trash2, ExternalLink, RefreshCw, FileText, Send, Clock, KeyRound, LogIn, Image as ImageIcon, Presentation, Type } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function expiryBadge(expiresAt) {
    if (!expiresAt) return <span className="badge-blue">Never</span>
    return new Date() > new Date(expiresAt)
        ? <span className="badge-red">Expired</span>
        : <span className="badge-green">{new Date(expiresAt).toLocaleDateString()}</span>
}

export default function UserDashboard() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState(null)
    const [messageInput, setMessageInput] = useState('')
    const [sendingMsg, setSendingMsg] = useState(false)
    const [authError, setAuthError] = useState(false)

    const fetchMyFiles = async () => {
        // Check if logged in first
        const token = localStorage.getItem('token')
        if (!token) {
            setAuthError(true)
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const res = await getMyFiles()
            setFiles(res.data.files)
        } catch (err) {
            if (err.response?.status === 401) {
                setAuthError(true)
            } else {
                toast.error('Failed to fetch your files.')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchMyFiles() }, [])

    const handleDelete = async (id, pdfId) => {
        if (!window.confirm(`Permanently delete ${pdfId}?`)) return
        setDeletingId(id)
        try {
            await deleteFile(id)
            toast.success(`File ${pdfId} deleted.`)
            setFiles(prev => prev.filter(f => f.id !== id))
        } catch { toast.error('Delete failed.') }
        finally { setDeletingId(null) }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        const token = localStorage.getItem('token')
        if (!token) {
            toast.error('You must be logged in to send messages.')
            navigate('/login')
            return
        }
        if (!messageInput.trim()) return

        setSendingMsg(true)
        try {
            await sendMessageToAdmin(messageInput)
            toast.success('Message sent to Admin!')
            setMessageInput('')
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again.')
                navigate('/login')
            } else {
                toast.error('Failed to send message.')
            }
        } finally {
            setSendingMsg(false)
        }
    }

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const totalStorageBytes = files.reduce((sum, f) => sum + (f.file_size || 0), 0)

    // Not logged in — show login prompt
    if (authError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-sm w-full">
                    <LogIn size={40} className="mx-auto mb-4 text-indigo-400" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-sm text-gray-500 mb-6">You need to be logged in to view your files and send messages.</p>
                    <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile & Files</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage your uploaded files and contact support.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4">
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-sm">
                            <span className="text-gray-500 mr-2">Storage Used:</span>
                            <span className="font-bold text-indigo-600">{formatSize(totalStorageBytes)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Contact Admin */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Send size={18} className="text-indigo-600" /> Contact Admin
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">Have an issue or need a storage quota increase? Send a secure message directly to the administrators.</p>

                            <form onSubmit={handleSendMessage}>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[120px] resize-none"
                                    placeholder="Type your message here..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    maxLength={500}
                                    required
                                />
                                <div className="text-right text-[10px] text-gray-400 mt-1 mb-4">{messageInput.length} / 500</div>
                                <button
                                    type="submit"
                                    disabled={sendingMsg || !messageInput.trim()}
                                    className="w-full btn-primary justify-center"
                                >
                                    {sendingMsg ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - File List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Your Uploaded Files</h2>
                                </div>
                                <button onClick={fetchMyFiles} className="text-gray-400 hover:text-indigo-600 transition-colors" disabled={loading} title="Refresh Files">
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="p-12"><Spinner /></div>
                            ) : files.length === 0 ? (
                                <div className="p-16 text-center text-gray-400">
                                    <FileText size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-medium text-gray-600">No files uploaded yet.</p>
                                    <p className="text-xs mt-1">Head over to the Upload tab to secure your first file.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                                <th className="px-6 py-3 font-semibold">File Details</th>
                                                <th className="px-6 py-3 font-semibold text-center">Size</th>
                                                <th className="px-6 py-3 font-semibold text-center">Status</th>
                                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {files.map(file => (
                                                <tr key={file.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                {file.file_type === 'image' ? <ImageIcon size={14} className="text-blue-500" /> : 
                                                                 file.file_type === 'ppt' ? <Presentation size={14} className="text-orange-500" /> : 
                                                                 file.file_type === 'notepad' ? <Type size={14} className="text-amber-500" /> : 
                                                                 <FileText size={14} className="text-red-500" />}
                                                                <span className="font-mono font-bold text-indigo-600 text-[13px] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{file.pdf_id}</span>
                                                                <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                                                    <KeyRound size={10} className="opacity-70" />
                                                                    <span className="font-mono">{file.secret_key}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                                                                <Clock size={11} />
                                                                {new Date(file.created_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-gray-600 text-xs font-medium">{formatSize(file.file_size)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {expiryBadge(file.expires_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {file.file_type !== 'notepad' && (
                                                                <a href={file.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View file source">
                                                                    <ExternalLink size={15} />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(file.id, file.pdf_id)}
                                                                disabled={deletingId === file.id}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete securely"
                                                            >
                                                                {deletingId === file.id ? <RefreshCw size={15} className="animate-spin text-red-500" /> : <Trash2 size={15} />}
                                                            </button>
                                                        </div>
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

            </div>
        </div>
    )
}
