import React, { useState, useEffect, useMemo } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import Pagination from '@shared/components/ui/Pagination';
import {
    HiOutlineCube,
    HiOutlineExclamationTriangle,
    HiOutlineArchiveBox,
    HiOutlineArrowsUpDown,
    HiOutlineMagnifyingGlass,
    HiOutlineFunnel,
    HiOutlinePlus,
    HiOutlineMinus,
    HiOutlineArrowPath,
    HiOutlineXMark,
    HiOutlineCheck,
    HiOutlineCalendarDays
} from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import { adminApi } from '../services/adminApi';
import { toast } from 'sonner';

const InventoryManagement = () => {
    const [activeView, setActiveView] = useState('inventory'); // 'inventory' or 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [inventory, setInventory] = useState([]);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adjustType, setAdjustType] = useState('Restock');
    const [adjustValue, setAdjustValue] = useState('');
    const [adjustNote, setAdjustNote] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const fetchInventory = async (silent = false, stockStatus) => {
        if (!silent) setIsLoading(true);
        try {
            // For single-vendor store, products and stock levels are Authoritative
            const params = { page: 1, limit: 200 }; // Fetch a large batch to show overview
            if (stockStatus === 'in') params.stockStatus = 'in';
            if (stockStatus === 'out') params.stockStatus = 'out';

            const res = await adminApi.getProducts(params);
            if (res.data.success) {
                const payload = res.data.result || {};
                const list = Array.isArray(payload.items) ? payload.items : (res.data.results || []);
                setInventory(
                    list.map(p => ({
                        ...p,
                        id: p._id,
                        threshold: p.lowStockAlert || 5,
                        status: p.stock === 0 ? 'Out of Stock' : (p.stock <= (p.lowStockAlert || 5) ? 'Low Stock' : 'In Stock')
                    }))
                );
            }
        } catch (error) {
            toast.error("Failed to load inventory");
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const fetchHistory = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const res = await adminApi.getStockHistory();
            if (res.data.success) {
                setHistory(res.data.result || res.data.results || []);
            }
        } catch (error) {
            toast.error("Failed to load adjustment logs");
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === 'inventory') {
            let stockStatusParam;
            if (filterStatus === 'In Stock') stockStatusParam = 'in';
            else if (filterStatus === 'Out of Stock') stockStatusParam = 'out';
            else stockStatusParam = undefined;
            fetchInventory(false, stockStatusParam);
        } else {
            fetchHistory();
        }
    }, [activeView, filterStatus]);

    const stats = useMemo(() => [
        { label: 'Total Inventory', value: inventory.reduce((acc, item) => acc + item.stock, 0), icon: HiOutlineCube, color: 'text-slate-900', bg: 'bg-slate-100', status: 'All' },
        { label: 'Low Stock Items', value: inventory.filter(i => i.stock > 0 && i.stock <= i.threshold).length, icon: HiOutlineExclamationTriangle, color: 'text-amber-600', bg: 'bg-amber-50', status: 'Low Stock' },
        { label: 'Out of Stock', value: inventory.filter(i => i.stock === 0).length, icon: HiOutlineArchiveBox, color: 'text-rose-600', bg: 'bg-rose-50', status: 'Out of Stock' },
        { label: 'Stock Valuation', value: `₹${inventory.reduce((acc, item) => acc + (item.stock * item.price), 0).toLocaleString()}`, icon: HiOutlineArrowsUpDown, color: 'text-emerald-600', bg: 'bg-emerald-50', status: 'In Stock' }
    ], [inventory]);

    const filteredInventory = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return inventory.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(term) ||
                (item.sku || '').toString().toLowerCase().includes(term);
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [inventory, searchTerm, filterStatus]);

    const handleFullAdjustment = async () => {
        const value = parseInt(adjustValue);
        if (isNaN(value) || value <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }

        try {
            const res = await adminApi.adjustStock({
                productId: selectedItem.id,
                type: adjustType === 'Restock' ? 'Restock' : 'Correction',
                quantity: adjustType === 'Restock' ? value : -value,
                note: adjustNote
            });

            if (res.data.success) {
                toast.success("Stock adjusted successfully");
                setIsAdjustModalOpen(false);
                fetchInventory(true);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to adjust stock");
        }
    };

    const openAdjustModal = (item) => {
        setSelectedItem(item);
        setAdjustValue('');
        setAdjustNote('');
        setIsAdjustModalOpen(true);
    };

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700 pb-16">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="ds-h1">Inventory Center</h1>
                    <p className="ds-description">Monitor warehouse stock levels, edit availability, and view audit history.</p>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1 shrink-0 self-start lg:self-center">
                    <button
                        onClick={() => { setActiveView('inventory'); setFilterStatus('All'); }}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", activeView === 'inventory' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
                    >
                        Stock Levels
                    </button>
                    <button
                        onClick={() => setActiveView('history')}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", activeView === 'history' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
                    >
                        Adjustment Logs
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            {activeView === 'inventory' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <Card key={idx} className="border-none shadow-sm ring-1 ring-slate-100 p-4 relative overflow-hidden group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setFilterStatus(stat.status)}>
                            <div className="flex items-center gap-3">
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300", stat.bg, stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="ds-label">{stat.label}</p>
                                    <h4 className="ds-stat-medium">{stat.value}</h4>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            {activeView === 'inventory' && (
                <Card className="border-none shadow-sm ring-1 ring-slate-100 p-3 bg-white/60 backdrop-blur-xl">
                    <div className="flex flex-col lg:flex-row gap-3 items-center">
                        <div className="relative flex-1 group w-full">
                            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-800 transition-all" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, SKU..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                            />
                        </div>
                        <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                                        filterStatus === status
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-100"
                                            : "bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Tables & Views */}
            {activeView === 'inventory' ? (
                <Card className="border-none shadow-xl ring-1 ring-slate-100 overflow-hidden rounded-xl bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Product Details</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest">SKU</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Current Stock</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Low Stock Alert</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-medium text-slate-500 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <HiOutlineArrowPath className="h-8 w-8 text-slate-900 animate-spin" />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching inventory records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No stock records found</td>
                                    </tr>
                                ) : filteredInventory.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                    <img src={item.mainImage || 'https://via.placeholder.com/150'} alt={item.name} className="h-full w-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[280px]">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.unit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-600">{item.sku || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.stock}</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{item.threshold} items</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={item.status === 'In Stock' ? 'success' : item.status === 'Low Stock' ? 'warning' : 'error'} className="text-[10px] uppercase font-bold tracking-wider px-2">
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openAdjustModal(item)}
                                                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Adjust Stock
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                /* History Logs view */
                <Card className="border-none shadow-xl ring-1 ring-slate-100 overflow-hidden rounded-xl bg-white p-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <HiOutlineCalendarDays className="h-5 w-5 text-slate-500" />
                            Audit History Trail
                        </h3>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold text-xs uppercase tracking-widest gap-2">
                                    <HiOutlineArrowPath className="h-6 w-6 animate-spin text-slate-600" />
                                    Loading history logs...
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 font-bold text-xs uppercase tracking-widest">No adjustment events recorded yet</div>
                            ) : history.map(log => (
                                <div key={log.id} className="flex gap-4 p-4 bg-slate-50/65 rounded-xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", log.type === 'Restock' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                        {log.type === 'Restock' ? <HiOutlinePlus className="h-4 w-4" /> : <HiOutlineMinus className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-slate-800 truncate">{log.productName}</p>
                                            <span className="text-[10px] font-mono font-black uppercase text-slate-400">{log.date} {log.time}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                            Quantity change: <span className={log.quantity.startsWith('+') ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{log.quantity}</span> | SKU: <span className="font-mono">{log.sku}</span>
                                        </p>
                                        <p className="text-[10.5px] font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-200/50 mt-2">"{log.note}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Adjust Stock Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Adjust Inventory</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <HiOutlineXMark className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-800">{selectedItem?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">SKU: {selectedItem?.sku} | Current: {selectedItem?.stock} units</p>
                        </div>

                        <div className="flex rounded-xl bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setAdjustType('Restock')}
                                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", adjustType === 'Restock' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600")}
                            >
                                Restock / Add Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdjustType('Correction')}
                                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", adjustType === 'Correction' ? "bg-white text-rose-600 shadow-sm" : "text-slate-600")}
                            >
                                Correction / Damaged
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Quantity</label>
                            <input
                                type="number"
                                value={adjustValue}
                                onChange={(e) => setAdjustValue(e.target.value)}
                                placeholder="Enter unit quantity"
                                className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-semibold outline-none ring-slate-900/5 focus:ring-2"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Adjustment Reason / Notes</label>
                            <textarea
                                value={adjustNote}
                                onChange={(e) => setAdjustNote(e.target.value)}
                                placeholder="Describe the reason for adjustment..."
                                className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm font-semibold outline-none ring-slate-900/5 focus:ring-2 min-h-[90px] resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFullAdjustment}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 transition-colors"
                            >
                                Confirm Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
