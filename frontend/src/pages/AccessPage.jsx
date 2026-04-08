import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { accessFile, updateFileText } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { 
    Key, FileText, AlertCircle, Download, Search, AlertTriangle, XCircle, 
    Image as ImageIcon, Presentation, Type, Save 
} from 'lucide-react'

const errorConfig = {
    401: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', title: 'Access Denied', hint: 'The secret key you entered is incorrect.' },
    404: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', title: 'File Not Found', hint: 'Check the ID and try again.' },
    410: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', title: 'File Expired', hint: 'This file is no longer accessible.' },
}
const defaultErr = { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', title: 'Error', hint: '' }

export default function AccessPage() {
    const [searchParams] = useSearchParams()
    const [pdfId, setPdfId] = useState(searchParams.get('pdf_id') || searchParams.get('id') || '')
    const [secretKey, setSecretKey] = useState(searchParams.get('key') || '')
    
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    
    // Notepad specific state
    const [noteText, setNoteText] = useState('')
    const [isSavingNote, setIsSavingNote] = useState(false)

    useEffect(() => {
        if ((searchParams.get('pdf_id') || searchParams.get('id')) && searchParams.get('key')) {
            handleAccess()
        }
    }, [])

    const handleAccess = async (e) => {
        if (e) e.preventDefault()
        if (!pdfId.trim() || !secretKey.trim()) {
            toast.error('Both File ID and Secret Key are required.'); return
        }
        setLoading(true); setError(null); setResult(null); setNoteText('')
        try {
            const res = await accessFile(pdfId.trim(), secretKey.trim())
            
            // If it's a notepad file, fetch the text content directly
            if (res.data.file_type === 'notepad') {
                try {
                    const textResponse = await fetch(res.data.file_url)
                    const text = await textResponse.text()
                    setNoteText(text)
                } catch (fetchErr) {
                    console.error('Failed to fetch note text:', fetchErr)
                    toast.error('Could not load notebook contents.')
                }
            }
            
            setResult(res.data)
            toast.success('Access granted!')
        } catch (err) {
            setError({ message: err.response?.data?.error || 'Something went wrong.', status: err.response?.status })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveNote = async () => {
        setIsSavingNote(true)
        try {
            await updateFileText(pdfId.trim(), secretKey.trim(), noteText)
            toast.success('Note saved securely.')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save changes.')
        } finally {
            setIsSavingNote(false)
        }
    }

    const renderViewer = () => {
        const type = result.file_type || 'pdf'
        const canDownload = result.allow_download !== false

        if (type === 'image') {
            return (
                <div className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-hidden border border-gray-200 mb-4" onContextMenu={(e) => !canDownload && e.preventDefault()}>
                    <img 
                        src={result.file_url} 
                        alt="Secure Image" 
                        className="max-w-full max-h-[600px] object-contain rounded drop-shadow-sm"
                        style={!canDownload ? { pointerEvents: 'none' } : {}}
                    />
                </div>
            )
        } else if (type === 'notepad') {
            return (
                <div className="mb-4">
                    {result.allow_edit ? (
                        <div className="space-y-3">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-full p-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[300px] resize-y bg-yellow-50/30"
                                placeholder="Type your secure notes here..."
                            />
                            <button
                                onClick={handleSaveNote}
                                disabled={isSavingNote}
                                className="btn-primary w-full justify-center"
                            >
                                <Save size={16} /> {isSavingNote ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full p-5 border border-amber-200 rounded-xl bg-amber-50/40 text-sm min-h-[200px] whitespace-pre-wrap text-gray-800 font-medium">
                            {noteText || 'This notebook is empty.'}
                        </div>
                    )}
                </div>
            )
        } else if (type === 'ppt') {
            return (
                <div className="flex flex-col justify-center items-center h-48 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <Presentation size={48} className="text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">PowerPoint Presentation</p>
                    <p className="text-xs text-gray-400 mt-1">Presentations require a compatible viewer to open locally.</p>
                </div>
            )
        } else {
            // Default to PDF
            // Adding #toolbar=0 disables the download/print toolbar in most browser native PDF viewers
            const url = canDownload ? result.file_url : `${result.file_url}#toolbar=0`
            return (
                <div className="rounded-lg overflow-hidden border border-gray-200 mb-4" onContextMenu={(e) => !canDownload && e.preventDefault()}>
                    <iframe src={url} title="PDF Preview" className="w-full h-[480px] bg-gray-50" />
                </div>
            )
        }
    }

    const getIcon = (type) => {
        switch(type) {
            case 'image': return <ImageIcon size={16} className="text-blue-500" />
            case 'ppt': return <Presentation size={16} className="text-orange-500" />
            case 'notepad': return <Type size={16} className="text-amber-500" />
            default: return <FileText size={16} className="text-red-500" />
        }
    }

    return (
        <div className="min-h-[80vh] bg-gray-50 py-14 px-4 animate-fade-in">
            <div className="max-w-xl mx-auto">
                <div className="mb-7">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Access Secure Vault</h1>
                    <p className="text-sm text-gray-500">Enter your File ID and secret key to view the secure content.</p>
                </div>

                {/* Form */}
                <div className="card shadow-medium mb-5">
                    <form onSubmit={handleAccess} className="space-y-4">
                        <div>
                            <label className="label">Access ID</label>
                            <input
                                type="text"
                                className="input-field font-mono uppercase tracking-widest text-indigo-700 font-medium"
                                placeholder="e.g. PDF-AB12C or TXT-9XYZ1"
                                value={pdfId}
                                onChange={(e) => setPdfId(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div>
                            <label className="label">Secret Key</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Enter the secret key"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
                            <Search size={15} /> Verify & Access
                        </button>
                    </form>
                </div>

                {loading && <Spinner label="Verifying credentials…" />}

                {/* Error */}
                {error && (() => {
                    const cfg = errorConfig[error.status] || defaultErr
                    const Icon = cfg.icon
                    return (
                        <div className={`flex gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border} animate-slide-up`}>
                            <Icon size={18} className={`${cfg.color} shrink-0 mt-0.5`} />
                            <div>
                                <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{error.message}</p>
                                {cfg.hint && <p className="text-xs text-gray-400 mt-0.5">{cfg.hint}</p>}
                            </div>
                        </div>
                    )
                })()}

                {/* Success */}
                {result && (
                    <div className="card shadow-medium animate-slide-up">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                {getIcon(result.file_type)}
                                <span className="font-semibold text-gray-900 text-sm font-mono tracking-wide">{result.pdf_id}</span>
                                {!result.allow_download && result.file_type !== 'notepad' && (
                                    <span className="ml-2 text-[10px] uppercase font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">View Only</span>
                                )}
                            </div>
                            {result.expires_at
                                ? <span className="badge-amber">Expires {new Date(result.expires_at).toLocaleDateString()}</span>
                                : <span className="badge-green">No Expiry</span>
                            }
                        </div>

                        {renderViewer()}

                        {result.file_type !== 'notepad' && result.allow_download !== false && (
                            <a
                                href={result.file_url}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="btn-secondary w-full justify-center py-2.5 mt-2"
                            >
                                <Download size={16} /> Download {result.file_type === 'image' ? 'Image' : result.file_type === 'ppt' ? 'Presentation' : 'Document'}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
