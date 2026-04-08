import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { uploadFile } from '../services/api'
import CopyButton from '../components/CopyButton'
import Spinner from '../components/Spinner'
import { 
    Upload, FileText, CheckCircle, X, Eye, EyeOff, UploadCloud, 
    Image as ImageIcon, Presentation, Type, Unlock, Lock, Download, EyeOff as BlockView 
} from 'lucide-react'

const EXPIRY_OPTIONS = [
    { label: '1 Hour', value: '1h' },
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: 'No Expiry', value: 'never' },
]

const FILE_TYPES = [
    { id: 'pdf', label: 'PDF', icon: FileText, accept: { 'application/pdf': ['.pdf'] } },
    { id: 'image', label: 'Image', icon: ImageIcon, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } },
    { id: 'ppt', label: 'Presentation', icon: Presentation, accept: { 'application/vnd.ms-powerpoint': ['.ppt'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] } },
    { id: 'notepad', label: 'Notepad', icon: Type, accept: null }, // no dropzone for notepad
]

export default function UploadPage() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    
    // Core states
    const [fileType, setFileType] = useState('pdf')
    const [file, setFile] = useState(null)
    const [noteText, setNoteText] = useState('')
    
    // Settings
    const [secretKey, setSecretKey] = useState('')
    const [expiry, setExpiry] = useState('24h')
    const [allowDownload, setAllowDownload] = useState(true) // For files
    const [allowEdit, setAllowEdit] = useState(false) // For notepad
    
    // Upload metadata
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState(null)
    const [showKey, setShowKey] = useState(false)

    // Current type properties
    const currentTypeConfig = FILE_TYPES.find(t => t.id === fileType)

    const onDrop = useCallback((accepted, rejected) => {
        if (rejected.length > 0) { 
            toast.error(`Invalid file format. Please upload a valid ${currentTypeConfig.label}.`)
            return 
        }
        setFile(accepted[0])
    }, [currentTypeConfig])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: currentTypeConfig?.accept,
        maxFiles: 1,
    })

    const handleUpload = async (e) => {
        e.preventDefault()
        
        let uploadFileObj = file;
        
        if (fileType === 'notepad') {
            if (!noteText.trim()) return toast.error('Please enter some text for your note.')
            // Convert string to a Blob/File
            uploadFileObj = new File([noteText], "notebook.txt", { type: "text/plain" })
        } else {
            if (!uploadFileObj) return toast.error(`Please select an ${currentTypeConfig.label} file.`)
        }
        
        if (!secretKey.trim()) return toast.error('Please enter a secret key.')

        const fd = new FormData()
        fd.append('file', uploadFileObj)
        fd.append('secret_key', secretKey)
        fd.append('expiry', expiry)
        fd.append('file_type', fileType)
        fd.append('allow_edit', allowEdit)
        fd.append('allow_download', allowDownload)

        setLoading(true); setProgress(0)
        try {
            const res = await uploadFile(fd, (evt) => {
                if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 90))
            })
            setProgress(100)
            setResult(res.data)
            toast.success(`${currentTypeConfig.label} uploaded! Copy your credentials below.`)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const accessUrl = result
        ? `${window.location.origin}/access?id=${result.pdf_id}&key=${result.secret_key}`
        : ''

    const renderToggle = () => {
        if (fileType === 'notepad') {
            return (
                <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 border-gray-200">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Note Permissions</p>
                        <p className="text-xs text-gray-500">Allow users to modify the text?</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAllowEdit(!allowEdit)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowEdit ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div className="text-xs font-medium w-24 text-right">
                        {allowEdit ? <span className="text-indigo-600 flex items-center justify-end gap-1"><Unlock size={12}/> Edit & Read</span> : <span className="text-gray-500 flex items-center justify-end gap-1"><Lock size={12}/> Read Only</span>}
                    </div>
                </div>
            )
        } else {
            return (
                <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 border-gray-200">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">File Permissions</p>
                        <p className="text-xs text-gray-500">Allow users to download?</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAllowDownload(!allowDownload)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowDownload ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowDownload ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div className="text-xs font-medium w-24 text-right">
                        {allowDownload ? <span className="text-indigo-600 flex items-center justify-end gap-1"><Download size={12}/> Download</span> : <span className="text-gray-500 flex items-center justify-end gap-1"><BlockView size={12}/> View Only</span>}
                    </div>
                </div>
            )
        }
    }

    if (result) {
        return (
            <div className="min-h-[80vh] bg-gray-50 flex items-start justify-center px-4 py-14 animate-slide-up">
                <div className="w-full max-w-md">
                    <div className="card border-emerald-200 bg-white shadow-medium">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle size={18} className="text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 text-sm">Upload successful</h2>
                                <p className="text-xs text-gray-500">Share credentials securely — never together</p>
                            </div>
                        </div>

                        {/* ID Display */}
                        <div className="mb-4">
                            <p className="label">{currentTypeConfig.label} ID · Share this publicly</p>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                <code className="font-mono text-indigo-600 font-bold text-base flex-1 tracking-wider">{result.pdf_id}</code>
                                <CopyButton text={result.pdf_id} label="ID" />
                            </div>
                        </div>

                        {/* Secret Key */}
                        <div className="mb-4">
                            <p className="label">Secret Key · Share separately</p>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                <code className="font-mono text-gray-700 flex-1 text-sm">
                                    {showKey ? result.secret_key : '••••••••••••'}
                                </code>
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                                <CopyButton text={result.secret_key} label="Secret Key" />
                            </div>
                        </div>

                        {result.expires_at && (
                            <p className="text-xs text-gray-400 mb-5">
                                Expires: {new Date(result.expires_at).toLocaleString()}
                            </p>
                        )}

                        {/* QR */}
                        <div className="flex flex-col items-center gap-2.5 mt-4 pt-5 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Quick Access QR</p>
                            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-soft">
                                <QRCodeSVG value={accessUrl} size={140} />
                            </div>
                            <p className="text-[10px] text-gray-400 break-all text-center max-w-xs">{accessUrl}</p>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 btn-secondary justify-center"
                            >
                                Secure Another
                            </button>
                            <button
                                onClick={() => {
                                    logout()
                                    navigate('/login')
                                }}
                                className="flex-1 btn-primary bg-red-600 hover:bg-red-700 border-red-600 justify-center"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[80vh] bg-gray-50 py-14 px-4 animate-fade-in">
            <div className="max-w-lg mx-auto">
                <div className="mb-7">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Secure a File</h1>
                    <p className="text-sm text-gray-500">Pick a format, set a key and expiry, then securely share.</p>
                </div>

                <div className="card shadow-medium">
                    <form onSubmit={handleUpload} className="space-y-5">
                        
                        {/* Type Selection */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {FILE_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => {
                                        setFileType(type.id); 
                                        setFile(null); 
                                    }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                                        fileType === type.id 
                                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <type.icon size={20} className="mb-1.5" />
                                    <span className="text-[10px] font-semibold tracking-wide uppercase">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Input Area (Dropzone vs Textarea) */}
                        <div className="mt-4">
                            {fileType === 'notepad' ? (
                                <textarea
                                    className="w-full p-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[160px] resize-y bg-indigo-50/10 placeholder:text-gray-400"
                                    placeholder="Type your secure notes here..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    required
                                />
                            ) : (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
                                        ? 'border-indigo-400 bg-indigo-50'
                                        : file
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    {file ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <currentTypeConfig.icon size={32} className="text-emerald-600" />
                                            <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                                className="mt-1 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <X size={11} /> Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                                            <UploadCloud size={32} className={isDragActive ? 'text-indigo-500' : ''} />
                                            <p className="font-medium text-sm">{isDragActive ? `Drop your ${currentTypeConfig.label} here` : `Drag & drop a ${currentTypeConfig.label}`}</p>
                                            <p className="text-xs">or click to browse files</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Permission Toggles */}
                        {renderToggle()}

                        {/* Secret Key */}
                        <div>
                            <label className="label">Secret Key</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. mySecretKey123"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-1.5">⚠ Share this key separately from the ID for security.</p>
                        </div>

                        {/* Expiry */}
                        <div>
                            <label className="label">Access Expiry</label>
                            <div className="grid grid-cols-4 gap-2">
                                {EXPIRY_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setExpiry(opt.value)}
                                        className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all duration-150 ${expiry === opt.value
                                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Progress */}
                        {loading && (
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                    <span>Securing…</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {loading
                            ? <Spinner label="Securing Vault…" />
                            : <button type="submit" className="btn-primary w-full justify-center py-2.5">
                                <Upload size={16} /> Secure {currentTypeConfig.label}
                            </button>
                        }
                    </form>
                </div>
            </div>
        </div>
    )
}
