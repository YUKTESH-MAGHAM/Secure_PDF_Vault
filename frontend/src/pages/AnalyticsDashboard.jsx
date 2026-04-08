import { useState, useEffect } from 'react'
import { getAnalytics } from '../services/api'
import AdminNavbar from '../components/AdminNavbar'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { FileText, Download, TrendingUp, Clock } from 'lucide-react'

// Pure CSS Bar Chart — no external dependencies
function BarChartSimple({ data, valueKey, label, color }) {
    if (!data || data.length === 0)
        return <div style={{ height: 220 }} className="flex items-center justify-center text-gray-400 text-sm">Not enough data to graph</div>

    const max = Math.max(...data.map(d => d[valueKey] || 0), 1)

    return (
        <div style={{ height: 260 }} className="flex flex-col justify-end">
            <div className="flex items-end gap-1 border-b border-gray-200 px-2 pb-1" style={{ height: 220 }}>
                {data.map((d, i) => {
                    const pct = ((d[valueKey] || 0) / max) * 100
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative" style={{ height: '100%', justifyContent: 'flex-end' }}>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:flex bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                                {d[valueKey]?.toFixed ? d[valueKey].toFixed(2) : d[valueKey]} {label}
                            </div>
                            <div
                                className="w-full rounded-t transition-all duration-500"
                                style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, minHeight: 3 }}
                            />
                        </div>
                    )
                })}
            </div>
            <div className="flex gap-1 px-2 pt-2" style={{ height: 40 }}>
                {data.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[9px] text-gray-400 truncate">{d.date}</div>
                ))}
            </div>
        </div>
    )
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!localStorage.getItem('admin_token')) {
            window.location.href = '/admin/login'
            return
        }
        const fetchAnalytics = async () => {
            try {
                const res = await getAnalytics()
                setData(res.data)
            } catch {
                toast.error('Failed to load analytics.')
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [])

    if (loading) return <div className="min-h-screen bg-gray-50 pt-20"><Spinner label="Crunching numbers..." /></div>
    if (!data) return null

    const stats = [
        { label: 'Total Vaulted Files', value: data.totalFiles, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Downloads', value: data.totalDownloads, icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Most Accessed ID', value: data.mostAccessed?.pdf_id || 'N/A', sub: `${data.mostAccessed?.downloads || 0} views`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AdminNavbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

                <div className="mb-8">
                    <h1 className="section-title">Analytics Dashboard</h1>
                    <p className="section-sub">System-wide usage metrics and storage trends</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map(s => (
                        <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg}`}>
                                <s.icon size={24} className={s.color} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-gray-900">{s.value}</h3>
                                    {s.sub && <span className="text-xs font-medium text-gray-400">{s.sub}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Storage Growth Chart */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Storage Consumption (MB)</h3>
                            <p className="text-sm text-gray-500 mb-4">Total megabytes uploaded per day</p>
                            <div className="h-[260px]">
                                <BarChartSimple data={data.chartData} valueKey="storageMB" label="MB" color="#4f46e5" />
                            </div>
                        </div>

                        {/* Upload Volume Chart */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Volume</h3>
                            <p className="text-sm text-gray-500 mb-4">Number of PDFs vaulted per day</p>
                            <div className="h-[260px]">
                                <BarChartSimple data={data.chartData} valueKey="uploads" label="files" color="#10b981" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Uploads Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={16} className="text-gray-400" /> Recent Activity
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {data.recentUploads.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
                                ) : (
                                    data.recentUploads.map((file, idx) => (
                                        <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono font-bold text-indigo-600 text-sm">{file.pdf_id}</span>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Vaulted</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{new Date(file.created_at).toLocaleString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
