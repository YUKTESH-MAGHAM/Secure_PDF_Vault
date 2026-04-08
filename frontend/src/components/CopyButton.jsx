import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success(`${label || 'Text'} copied!`)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Failed to copy')
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-indigo-600 hover:text-white border border-gray-200 text-gray-600 transition-all duration-150 shrink-0 font-medium"
            title="Copy to clipboard"
        >
            {copied ? (
                <>
                    <Check size={12} className="text-emerald-400" />
                    Copied
                </>
            ) : (
                <>
                    <Copy size={12} />
                    Copy
                </>
            )}
        </button>
    )
}
