import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, Clock, Zap, Upload, Key, Download, ArrowRight } from 'lucide-react'

const features = [
    {
        icon: ShieldCheck,
        title: 'Secret Key Protection',
        description: 'Every file is gated behind a secret key only you set. No account needed.',
    },
    {
        icon: Clock,
        title: 'Time-Limited Access',
        description: 'Files can automatically expire in 1 hour, 24 hours, 7 days — or never.',
    },
    {
        icon: Zap,
        title: 'QR Code Sharing',
        description: 'Get a scannable QR link after upload. Recipients enter the key to access.',
    },
    {
        icon: Lock,
        title: 'Zero Storage on Client',
        description: 'Files stored securely on cloud infrastructure. Nothing saved locally.',
    },
]

const steps = [
    { step: 1, icon: Upload, title: 'Upload your File', desc: 'Drag & drop any PDF. Set a secret key and expiry window.' },
    { step: 2, icon: Key, title: 'Get your File ID', desc: 'System generates a short unique ID (e.g. PDF-KX72M9). Share it.' },
    { step: 3, icon: Download, title: 'Recipient accesses', desc: 'They enter the ID + your secret key to preview and download.' },
]



export default function LandingPage() {
    return (
        <div className="animate-fade-in">

            {/* Hero */}
            <section className="relative bg-white dark:bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white dark:from-indigo-950/20 dark:via-gray-900 dark:to-gray-900 pointer-events-none" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">



                    <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-5">
                        Share files securely,
                        <br />
                        <span className="text-indigo-600">on your terms.</span>
                    </h1>

                    <p className="text-lg text-gray-500 max-w-xl mx-auto mb-9 leading-relaxed">
                        Set expiry times, protect with secret keys, and generate QR shareable links — all without accounts or software installs.
                    </p>

                    <div className="flex gap-3 justify-center flex-wrap">
                        <Link to="/upload" className="btn-primary text-sm px-6 py-2.5 shadow-md">
                            <Upload size={16} /> Upload File
                        </Link>
                        <Link to="/access" className="btn-secondary text-sm px-6 py-2.5">
                            <Key size={16} /> Access a File
                        </Link>
                    </div>


                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for real-world file sharing</h2>
                        <p className="text-gray-500 max-w-lg mx-auto text-sm">
                            Everything you need to send documents with confidence.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((f) => {
                            const Icon = f.icon
                            return (
                                <div key={f.title} className="card-hover group">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                        <Icon size={18} className="text-indigo-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{f.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-white border-t border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
                        <p className="text-gray-500 text-sm">Three steps. No friction.</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-8">
                        {steps.map((s) => {
                            const Icon = s.icon
                            return (
                                <div key={s.step} className="flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                            <Icon size={24} className="text-indigo-600" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                                            {s.step}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{s.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Strip */}
            <section className="py-16 bg-indigo-600">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Ready to share your first file?</h2>
                    <p className="text-indigo-200 text-sm mb-7">Secure, expiring, key-protected — in under 30 seconds.</p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-7 py-3 rounded-lg hover:bg-indigo-50 transition-colors shadow-md text-sm"
                    >
                        Start Uploading <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    )
}
