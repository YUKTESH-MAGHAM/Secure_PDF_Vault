import { useState, useEffect } from 'react'
import { getAdminInbox, markAdminMessageRead } from '../services/api'
import AdminNavbar from '../components/AdminNavbar'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { Inbox, CheckCircle2, Clock, Mail } from 'lucide-react'

export default function AdminInbox() {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchInbox = async () => {
        setLoading(true)
        try {
            const res = await getAdminInbox()
            setMessages(res.data)
        } catch {
            toast.error('Failed to load inbox messages.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Authenticate like UserManagement
        if (!localStorage.getItem('admin_token')) {
            window.location.href = '/admin/login'
            return
        }
        fetchInbox()
    }, [])

    const handleToggleReadStatus = async (id, currentStatus) => {
        const nextStatus = !currentStatus
        try {
            await markAdminMessageRead(id, nextStatus)
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: nextStatus } : m))
            toast.success(nextStatus ? 'Marked as read.' : 'Marked as unread.')
        } catch {
            toast.error('Failed to update status.')
        }
    }

    const unreadCount = messages.filter(m => !m.is_read).length

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AdminNavbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="section-title">Support Inbox</h1>
                        <p className="section-sub">Read and manage messages sent by users</p>
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-sm flex items-center gap-2">
                        <Inbox size={16} className="text-gray-400" />
                        <span className="text-gray-600 font-medium">Unread:</span>
                        <span className={`font-bold ${unreadCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{unreadCount}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="mt-20"><Spinner /></div>
                ) : messages.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                        <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">Inbox is empty</h3>
                        <p className="text-gray-500 mt-2 text-sm">You have no messages from any users.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-6 rounded-2xl border transition-all ${msg.is_read
                                        ? 'bg-white border-gray-200 grayscale-[0.3] opacity-80'
                                        : 'bg-indigo-50/50 border-indigo-100 shadow-sm ring-1 ring-indigo-50 relative'
                                    }`}
                            >
                                {!msg.is_read && (
                                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 m-4 shadow-sm animate-pulse"></div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.is_read ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{msg.email}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={11} /> {new Date(msg.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleReadStatus(msg.id, msg.is_read)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${msg.is_read
                                                ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                                            }`}
                                    >
                                        <CheckCircle2 size={14} className={msg.is_read ? 'text-green-500' : 'text-indigo-400'} />
                                        {msg.is_read ? 'Mark Unread' : 'Mark as Read'}
                                    </button>
                                </div>
                                <div className={`pl-[52px] text-sm ${msg.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
