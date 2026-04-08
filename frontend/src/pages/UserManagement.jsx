import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import AdminNavbar from '../components/AdminNavbar'
import toast from 'react-hot-toast'
import { Users, ShieldOff, Trash2, UserX, UserCheck, MessageSquare, X, Eye, EyeOff, KeyRound, KeySquare } from 'lucide-react'
import { getAllUsers, suspendUser, deleteUser, sendAdminMessage, updateStorageLimit, resetUserPassword } from '../services/api'

function useAdminAuth() {
    const navigate = useNavigate()
    useEffect(() => {
        if (!localStorage.getItem('admin_token')) navigate('/admin/login')
    }, [])
}

export default function UserManagement() {
    useAdminAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // Messaging Modal State
    const [messageModalOpen, setMessageModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [messageInput, setMessageInput] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const [revealedPasswords, setRevealedPasswords] = useState({})

    const togglePasswordReveal = (id) => setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }))

    // Reset Password Modal
    const [resetModalOpen, setResetModalOpen] = useState(false)
    const [resetUser, setResetUser] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [showNewPw, setShowNewPw] = useState(false)
    const [resetting, setResetting] = useState(false)

    const openResetModal = (user) => { setResetUser(user); setNewPassword(''); setShowNewPw(false); setResetModalOpen(true) }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!newPassword || newPassword.trim().length < 4) {
            toast.error('Password must be at least 4 characters.')
            return
        }
        setResetting(true)
        try {
            await resetUserPassword(resetUser.id, newPassword)
            toast.success(`Password for ${resetUser.email} has been reset.`)
            setResetModalOpen(false)
        } catch {
            toast.error('Failed to reset password.')
        } finally {
            setResetting(false)
        }
    }

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await getAllUsers()
            setUsers(res.data)
        } catch (err) {
            toast.error('Failed to load users.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const toggleSuspend = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'active' ? 'suspended' : 'active'
        try {
            await suspendUser(id, nextStatus)
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u))
            toast.success(`User ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}.`)
        } catch (err) {
            toast.error('Failed to update user status.')
        }
    }

    const handleDeleteUser = async (id, email) => {
        if (!window.confirm(`Remove user ${email}? This cannot be undone.`)) return
        try {
            await deleteUser(id)
            setUsers(prev => prev.filter(u => u.id !== id))
            toast.success('User removed.')
        } catch (err) {
            toast.error('Failed to remove user.')
        }
    }

    const handleUpdateLimit = async (id, newLimit) => {
        try {
            await updateStorageLimit(id, newLimit)
            setUsers(prev => prev.map(u => u.id === id ? { ...u, storageLimitMB: newLimit } : u))
            toast.success(`Storage limit updated to ${newLimit}MB.`)
        } catch (err) {
            toast.error('Failed to update limit.')
        }
    }

    const openMessageModal = (user) => {
        setSelectedUser(user)
        setMessageInput(user.pendingMessage || '')
        setMessageModalOpen(true)
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        setSendingMessage(true)
        try {
            await sendAdminMessage(selectedUser.id, messageInput)
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, pendingMessage: messageInput } : u))
            toast.success(messageInput ? 'Mandatory message sent to user.' : 'Message cleared.')
            setMessageModalOpen(false)
        } catch (err) {
            toast.error('Failed to send message.')
        } finally {
            setSendingMessage(false)
        }
    }

    const stats = [
        { label: 'Total Users', value: users.length },
        { label: 'Active', value: users.filter(u => u.status === 'active').length },
        { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length },
        { label: 'Total Files', value: users.reduce((a, u) => a + u.files, 0) },
    ]

    if (loading) return <div className="min-h-screen bg-gray-50 pt-20"><Spinner label="Loading users..." /></div>

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AdminNavbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="section-title">User Management</h1>
                        <p className="section-sub">View registered users and manage their access</p>
                    </div>
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

                {/* Users Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                        <Users size={15} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Registered Users</span>
                    </div>

                    {users.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <ShieldOff size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No users found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                                        <th className="px-5 py-3 font-medium">Email</th>
                                        <th className="px-5 py-3 font-medium"><span className="flex items-center gap-1"><KeyRound size={11} /> Password</span></th>
                                        <th className="px-5 py-3 font-medium">Status & Alerts</th>
                                        <th className="px-5 py-3 font-medium">Storage Quota</th>
                                        <th className="px-5 py-3 font-medium">Joined</th>
                                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-900 font-medium text-sm">{user.email}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 max-w-[180px]">
                                                    <span
                                                        className={`font-mono text-xs truncate ${revealedPasswords[user.id] ? 'text-gray-700' : 'text-gray-300 tracking-widest select-none'}`}
                                                        title={revealedPasswords[user.id] ? user.passwordHash : 'Click eye to reveal hash'}
                                                    >
                                                        {revealedPasswords[user.id] ? user.passwordHash : '••••••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePasswordReveal(user.id)}
                                                        className="text-gray-400 hover:text-indigo-500 transition-colors shrink-0"
                                                        title={revealedPasswords[user.id] ? 'Hide' : 'Reveal bcrypt hash'}
                                                    >
                                                        {revealedPasswords[user.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 flex flex-col gap-1.5 items-start">
                                                {user.status === 'active'
                                                    ? <span className="badge-green">Active</span>
                                                    : <span className="badge-red">Suspended</span>}
                                                {user.pendingMessage && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                        Message Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-900 text-xs font-semibold">
                                                        {(user.storageUsedMB || 0).toFixed(2)} MB <span className="text-gray-400 font-normal ml-0.5">used</span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-[10px] uppercase">Limit:</span>
                                                        <input
                                                            type="number"
                                                            className="w-16 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            defaultValue={user.storageLimitMB || 50}
                                                            onBlur={(e) => {
                                                                if (e.target.value != user.storageLimitMB) {
                                                                    handleUpdateLimit(user.id, e.target.value)
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-gray-400 text-[10px]">MB</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(user.joined).toLocaleDateString()}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors flex items-center gap-1.5"
                                                        onClick={() => openMessageModal(user)}
                                                    >
                                                        <MessageSquare size={12} className={user.pendingMessage ? "text-orange-500" : "text-gray-400"} />
                                                        Message
                                                    </button>
                                                    <button
                                                        className="px-2.5 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-xs font-medium transition-colors flex items-center gap-1.5"
                                                        onClick={() => openResetModal(user)}
                                                    >
                                                        <KeyRound size={12} />
                                                        Reset PW
                                                    </button>
                                                    <button
                                                        className="btn-warning"
                                                        onClick={() => toggleSuspend(user.id, user.status)}
                                                    >
                                                        {user.status === 'active'
                                                            ? <><UserX size={12} /> Suspend</>
                                                            : <><UserCheck size={12} /> Reactivate</>}
                                                    </button>
                                                    <button
                                                        className="btn-danger flex items-center gap-1.5"
                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                    >
                                                        <Trash2 size={12} /> Remove
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

            {/* Messaging Modal */}
            {messageModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Message User</h3>
                            <button onClick={() => setMessageModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                This message will appear as a mandatory popup the next time <span className="font-semibold text-gray-800">{selectedUser.email}</span> logs in. They must enter their password to acknowledge and dismiss it.
                            </p>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[120px]"
                                placeholder="Type your warning or message here..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                            />
                            <div className="mt-6 flex justify-between items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setMessageInput(''); handleSendMessage({ preventDefault: () => { } }) }}
                                    className="text-xs text-gray-500 hover:text-red-600 font-medium"
                                >
                                    Clear Active Message
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMessageModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingMessage || !messageInput}
                                        className="btn-primary"
                                    >
                                        {sendingMessage ? 'Sending...' : 'Send Alert'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModalOpen && resetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                            <button onClick={() => setResetModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                Set a new password for <span className="font-semibold text-gray-800">{resetUser.email}</span>.
                            </p>
                            <div className="relative">
                                <input
                                    type={showNewPw ? 'text' : 'password'}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="New password (min 4 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoFocus
                                />
                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            <div className="mt-5 flex gap-3 justify-end">
                                <button type="button" onClick={() => setResetModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={resetting} className="btn-primary">
                                    {resetting ? 'Resetting…' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
