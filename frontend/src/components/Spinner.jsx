export default function Spinner({ size = 'md', label }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-7 h-7 border-2',
        lg: 'w-10 h-10 border-2',
    }
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div
                className={`${sizes[size]} rounded-full border-gray-200 border-t-indigo-600 animate-spin`}
            />
            {label && <p className="text-sm text-gray-500">{label}</p>}
        </div>
    )
}
