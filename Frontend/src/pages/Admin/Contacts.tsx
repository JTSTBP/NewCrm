import React, { useEffect, useState } from 'react';
import { Search, Filter, Phone, ChevronLeft, ChevronRight, Clock, MessageCircle, Linkedin, UserCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LeadModal from '../../components/modals/LeadModal';

interface POC {
    lead_id: string;
    company_name: string;
    poc_id: string;
    name: string;
    designation: string;
    contact: string;
    linkedin_url: string;
    created_at: string;
    assigned_by: string;
    remarks: string;
    remarks_count: number;
    all_remarks: { content: string; created_at: string; by: string }[];
}

const Contacts: React.FC = () => {
    const navigate = useNavigate();
    const [pocs, setPocs] = useState<POC[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPocs, setTotalPocs] = useState(0);

    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openLeadModal = (leadId: string) => {
        setSelectedLeadId(leadId);
        setIsModalOpen(true);
    };

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchPocs();
    }, [page, debouncedTerm]);

    const fetchPocs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: debouncedTerm
            });

            const response = await fetch(`${API_BASE_URL}/api/leads/pocs?${params.toString()}`, {
                headers: {
                    'x-auth-token': token || ''
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to fetch contacts');
            }

            const data = await response.json();
            setPocs(data.pocs || []);
            setTotalPages(data.totalPages || 1);
            setTotalPocs(data.totalPocs || 0);

        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to fetch contacts');
        } finally {
            setLoading(false);
        }
    };

    if (loading && pocs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]"></div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pr-1 -mr-1 custom-scrollbar pb-20 sm:pb-10">
            <div className="flex flex-col space-y-4 lg:space-y-6 min-h-full">
                <div className="bg-[#f8fafc] lg:pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-[#0f1c2e] tracking-tight">Contacts</h1>
                            <p className="text-slate-500 text-sm mt-1">Directory of all Points of Contact across leads.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, company, phone or assignee..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#0ea5e9]/10 focus:border-[#0ea5e9] transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                                <Filter size={18} />
                                Filters
                            </button>
                            <button
                                onClick={fetchPocs}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#0ea5e9] transition-colors shadow-sm"
                                title="Refresh List"
                            >
                                <Clock size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    {/* Mobile Cards */}
                    <div className="grid grid-cols-1 gap-4 lg:hidden">
                        {pocs.length > 0 ? (
                            pocs.map((poc) => {
                                const linkPrefix = window.location.pathname.startsWith('/admin') ? '/admin' : '/bd';
                                return (
                                    <div
                                        key={`${poc.lead_id}-${poc.poc_id}`}
                                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.99] transition-all cursor-pointer group"
                                        onClick={() => navigate(`${linkPrefix}/contacts/${poc.poc_id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0184c7] flex items-center justify-center text-white font-bold shadow-md">
                                                    {poc.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#0f1c2e] group-hover:text-[#0ea5e9] group-hover:underline transition-colors block">
                                                        {poc.name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        {poc.designation || 'No Designation'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                                            <div className="space-y-1">
                                                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Company</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openLeadModal(poc.lead_id);
                                                    }}
                                                    className="text-xs font-bold text-[#0ea5e9] hover:underline text-left truncate max-w-full block"
                                                >
                                                    {poc.company_name}
                                                </button>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Created</p>
                                                <p className="text-xs font-bold text-[#0f1c2e]">{new Date(poc.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-slate-50 font-bold">
                                            <a
                                                href={`tel:${poc.contact}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 bg-slate-50 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                                            >
                                                <Phone size={14} /> {poc.contact || 'No Contact'}
                                            </a>
                                            <a
                                                href={`https://wa.me/${poc.contact.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 bg-green-50 rounded-xl text-xs text-green-600 hover:bg-green-100 transition-colors"
                                            >
                                                <MessageCircle size={14} /> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                                No contacts found matching your search.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-200/60">
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">POC Name</th>
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">Lead / Company</th>
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">Contact & Link</th>
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">Created Date</th>
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">Assigned By</th>
                                        <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider max-w-[200px]">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pocs.length > 0 ? (
                                        pocs.map((poc, index) => {
                                            const linkPrefix = window.location.pathname.startsWith('/admin') ? '/admin' : '/bd';
                                            return (
                                                <tr
                                                    key={`${poc.lead_id}-${poc.poc_id}`}
                                                    className="hover:bg-slate-50/50 transition-colors group animate-in fade-in duration-300 cursor-pointer"
                                                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                                                    onClick={() => navigate(`${linkPrefix}/contacts/${poc.poc_id}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#0184c7] flex items-center justify-center text-white text-sm font-bold shadow-md">
                                                                {poc.name?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <span className="text-sm font-bold text-[#0f1c2e] group-hover:text-[#0ea5e9] group-hover:underline transition-colors block">
                                                                {poc.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openLeadModal(poc.lead_id);
                                                            }}
                                                            className="text-sm font-bold text-[#0ea5e9] hover:underline text-left"
                                                        >
                                                            {poc.company_name}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-slate-600">
                                                            {poc.designation || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                                <Phone size={14} className="text-slate-400" />
                                                                {poc.contact || 'N/A'}
                                                            </span>
                                                            <div className="flex gap-2">
                                                                {poc.linkedin_url && (
                                                                    <a
                                                                        href={poc.linkedin_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-xs text-sky-600 hover:underline flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-md"
                                                                    >
                                                                        <Linkedin size={12} /> LinkedIn
                                                                    </a>
                                                                )}
                                                                <a
                                                                    href={`https://wa.me/${poc.contact.replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-xs text-green-600 hover:underline flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md"
                                                                >
                                                                    <MessageCircle size={12} /> WhatsApp
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                            <Clock size={14} className="text-slate-400" />
                                                            {new Date(poc.created_at).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                            <UserCircle size={14} className="text-slate-400" />
                                                            {poc.assigned_by || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[200px] relative group/remarks">
                                                        <div className="flex items-center gap-2 cursor-pointer w-full">
                                                            {poc.remarks_count === 0 && (
                                                                <span className="text-sm text-slate-600 truncate block flex-1">None</span>
                                                            )}
                                                            {poc.remarks_count === 1 && (
                                                                <span className="text-sm text-slate-600 truncate block flex-1" title={poc.remarks}>
                                                                    {poc.remarks}
                                                                </span>
                                                            )}
                                                            {poc.remarks_count > 1 && (
                                                                <span className="px-2 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs font-bold rounded-md shrink-0 border border-[#0ea5e9]/20 hover:bg-[#0ea5e9]/20 transition-colors">
                                                                    {poc.remarks_count} Remarks
                                                                </span>
                                                            )}
                                                        </div>
                                                        {poc.remarks_count > 0 && (
                                                            <div className="absolute right-2 sm:right-6 top-full mt-2 w-72 max-w-[80vw] bg-slate-800 rounded-xl p-4 shadow-2xl opacity-0 invisible group-hover/remarks:opacity-100 group-hover/remarks:visible transition-all z-[100] transform translate-y-2 group-hover/remarks:translate-y-0">
                                                                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">All Remarks</p>
                                                                <div className="max-h-56 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                                                    {poc.all_remarks?.map((rmk, i) => (
                                                                        <div key={i} className="text-xs border-l-[3px] border-[#0ea5e9] pl-3">
                                                                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{rmk.content}</p>
                                                                            <div className="flex justify-between items-center text-slate-500 mt-1.5 text-[0.65rem] font-medium">
                                                                                <span>{rmk.by}</span>
                                                                                <span>{new Date(rmk.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                                                No contacts found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border shadow-sm">
                        <div className="text-xs sm:text-sm font-medium text-slate-500 text-center sm:text-left">
                            Page <span className="text-[#0f1c2e] font-bold">{page}</span> of <span className="text-[#0f1c2e] font-bold">{totalPages}</span>
                            <span className="hidden sm:inline mx-2 text-slate-300">|</span>
                            <span className="block sm:inline mt-1 sm:mt-0">Total Results: <span className="text-[#0f1c2e] font-bold">{totalPocs}</span></span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-center">
                            <button
                                disabled={page === 1 || loading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-[#0ea5e9] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                disabled={page === totalPages || loading}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-[#0ea5e9] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {isModalOpen && (
                <LeadModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    leadId={selectedLeadId}
                    initialMode="view"
                    onUpdate={fetchPocs}
                />
            )}
        </div>
    );
};

export default Contacts;
