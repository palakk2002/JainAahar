import React, { useState, useEffect, useMemo } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    HiOutlineCurrencyDollar,
    HiOutlineTruck,
    HiOutlineUser,
    HiOutlineChartBar,
    HiOutlineArrowPath,
    HiOutlineCalendarDays
} from 'react-icons/hi2';
import { adminApi } from '../services/adminApi';
import { toast } from 'sonner';

const StoreAnalytics = () => {
    const [range, setRange] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [stats, setStats] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, earningsRes] = await Promise.all([
                adminApi.getStoreStats(range),
                adminApi.getStoreEarnings()
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.result || statsRes.data.results);
            }
            if (earningsRes.data.success) {
                setEarnings(earningsRes.data.result || earningsRes.data.results);
            }
        } catch (error) {
            toast.error("Failed to load store business analytics");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [range]);

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700 pb-16 font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="ds-h1">Business Analytics & Earnings</h1>
                    <p className="ds-description">Real-time stats on orders, customer retention, net revenue, and transaction details.</p>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1 shrink-0 self-start lg:self-center">
                    {['daily', 'weekly', 'monthly'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                                range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Gross Sales', val: stats?.overview?.totalSales || '₹0', icon: HiOutlineCurrencyDollar, bg: 'bg-emerald-50 text-emerald-600', trend: stats?.overview?.salesTrend },
                    { label: 'Completed Orders', val: stats?.overview?.totalOrders || '0', icon: HiOutlineTruck, bg: 'bg-indigo-50 text-indigo-600', trend: stats?.overview?.ordersTrend },
                    { label: 'Average Order Value', val: stats?.overview?.avgOrderValue || '₹0', icon: HiOutlineChartBar, bg: 'bg-amber-50 text-amber-600' },
                    { label: 'Customer Conversion', val: stats?.overview?.conversionRate || '0%', icon: HiOutlineUser, bg: 'bg-rose-50 text-rose-600' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm ring-1 ring-slate-100 p-4 relative overflow-hidden group bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            {stat.trend && (
                                <Badge variant={stat.trend.startsWith('+') ? 'success' : 'error'} className="text-[9px] font-bold">
                                    {stat.trend}
                                </Badge>
                            )}
                        </div>
                        <p className="ds-label">{stat.label}</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1">{stat.val}</h4>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart: Revenue trends */}
                <Card className="lg:col-span-2 p-6 border-none ring-1 ring-slate-100 bg-white">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Revenue & Sales Volume Trend</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="sales" name="Sales (₹)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Categories Mix Radar */}
                <Card className="p-6 border-none ring-1 ring-slate-100 bg-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category Breakdown</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Distribution of products across store categories.</p>
                    </div>
                    <div className="h-64 w-full flex items-center justify-center">
                        {stats?.categoryMix && stats.categoryMix.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.categoryMix}>
                                    <PolarGrid stroke="#f1f5f9" />
                                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                                    <PolarRadiusAxis stroke="#e2e8f0" fontSize={8} />
                                    <Radar name="Products" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No category data</span>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Selling Products */}
                <Card className="p-6 border-none ring-1 ring-slate-100 bg-white">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Performing Products</h3>
                    <div className="space-y-4">
                        {stats?.topProducts?.length > 0 ? (
                            stats.topProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{p.name}</p>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.sales} Sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900">{p.revenue}</p>
                                        <span className="text-[9px] font-bold text-emerald-600">+{p.trend}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider py-8 text-center">No transactions yet</p>
                        )}
                    </div>
                </Card>

                {/* Ledger & earnings logs */}
                <Card className="lg:col-span-2 p-6 border-none ring-1 ring-slate-100 bg-white">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        Recent Transactions
                        <span className="text-[10px] text-slate-400 font-semibold capitalize">Settled Balance: ₹{earnings?.balances?.settledBalance || 0}</span>
                    </h3>
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {earnings?.ledger?.length > 0 ? (
                            earnings.ledger.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                                            log.amount >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        }`}>
                                            <HiOutlineCurrencyDollar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{log.type}</p>
                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Ref: {log.ref} | Date: {log.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs font-black ${log.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {log.amount >= 0 ? `+₹${log.amount}` : `-₹${Math.abs(log.amount)}`}
                                        </p>
                                        <Badge variant={log.status === 'Settled' ? 'success' : 'warning'} className="text-[8px] tracking-wider px-1 font-bold mt-0.5">
                                            {log.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider py-12 text-center">No transactions recorded</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StoreAnalytics;
