import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, CheckCircle, AlertCircle, Globe, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';
import AddIncompleteLeadModal from '../../components/modals/AddIncompleteLeadModal';

interface PointOfContact {
    _id: string;
    name: string;
    phone: string;
    approvalStatus: 'pending' | 'approved';
}

interface Lead {
    _id: string;
    company_name?: string;
    website_url: string;
    status: 'incomplete' | 'approved';
    assignedBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
    points_of_contact: PointOfContact[];
}

const AddLeadTab: React.FC = () => {
    const [incompleteLeads, setIncompleteLeads] = useState<Lead[]>([]);
    const [fetching, setFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isPocOnlyMode, setIsPocOnlyMode] = useState(false);
    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [checkUrl, setCheckUrl] = useState('');
    const [checking, setChecking] = useState(false);
    const [activeTab, setActiveTab] = useState<'leads' | 'pocs'>('leads');

    // Fetch leads - server side filtered if search is present
    const fetchIncompleteLeads = useCallback(async (searchQuery: string = '') => {
        try {
            setFetching(true);
            const token = localStorage.getItem('token');
            const url = new URL(`${API_BASE_URL}/api/leads`);
            url.searchParams.append('status', 'incomplete');
            if (searchQuery) {
                url.searchParams.append('search', searchQuery);
            }

            const response = await fetch(url.toString(), {
                headers: { 'x-auth-token': token || '' }
            });
            if (response.ok) {
                const data = await response.json();
                setIncompleteLeads(data.leads);
            }
        } catch (err) {
            toast.error('Failed to fetch leads');
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchIncompleteLeads();
    }, [fetchIncompleteLeads]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchIncompleteLeads(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchIncompleteLeads]);

    const handleApprove = async (id: string) => {
        if (!window.confirm('Approve this lead? It will moved to the main leads list.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/${id}/approve`, {
                method: 'PATCH',
                headers: { 'x-auth-token': token || '' }
            });

            if (response.ok) {
                toast.success('Lead and contacts approved!');
                fetchIncompleteLeads(searchTerm);
            } else {
                const data = await response.json();
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMsg = data.errors.join(' ');
                    toast.error(`${data.message} ${errorMsg}`, { duration: 5000 });
                } else {
                    throw new Error(data.message || 'Failed to approve lead');
                }
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleApprovePoc = async (leadId: string, pocId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/approve-poc/${pocId}`, {
                method: 'PATCH',
                headers: { 'x-auth-token': token || '' }
            });

            if (response.ok) {
                toast.success('Point of Contact approved!');
                fetchIncompleteLeads(searchTerm);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to approve contact');
            }
        } catch (err) {
            toast.error('Server error');
        }
    };

    const handleDeletePoc = async (leadId: string, pocId: string, pocName: string) => {
        if (!window.confirm(`Are you sure you want to delete contact "${pocName}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/poc/${pocId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });

            if (response.ok) {
                toast.success('Point of Contact deleted!');
                fetchIncompleteLeads(searchTerm);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete contact');
            }
        } catch (err) {
            toast.error('Server error');
        }
    };

    const handleEditPoc = (leadId: string) => {
        setSelectedLeadId(leadId);
        setIsPocOnlyMode(true);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setSelectedLeadId(id);
        setIsPocOnlyMode(false);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });

            if (response.ok) {
                toast.success('Lead deleted!');
                fetchIncompleteLeads(searchTerm);
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete lead');
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleOpenCreateModal = () => {
        setSelectedLeadId(null);
        setIsPocOnlyMode(false);
        setIsModalOpen(true);
    };

    const handleCheckUrl = async () => {
        if (!checkUrl) return toast.error('Please enter a website URL');

        try {
            setChecking(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/check?url=${encodeURIComponent(checkUrl)}`, {
                headers: { 'x-auth-token': token || '' }
            });

            const data = await response.json();
            if (response.ok) {
                // Lead found, open modal in edit mode
                setSelectedLeadId(data.id);
                setIsPocOnlyMode(true);
                setIsModalOpen(true);
                setIsCheckModalOpen(false);
                setCheckUrl('');
            } else {
                toast.error(data.message || 'Lead not found. You can add it as a new lead.');
            }
        } catch (err) {
            toast.error('Error checking lead existence');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1c2e] tracking-tight">Lead Approvals</h1>
                    <p className="text-sm text-slate-500 mt-1">Review and approve pending leads and contacts for the main dashboard.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCheckModalOpen(true)}
                        className="bg-white border-2 border-slate-100 text-[#0ea5e9] px-6 py-3 rounded-2xl font-black transition-all hover:bg-sky-50 hover:border-[#0ea5e9]/20 active:scale-[0.98] shadow-lg shadow-slate-200/50 text-sm flex items-center gap-2.5"
                    >
                        <Plus size={20} className="stroke-[3]" />
                        Add POC
                    </button>
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-[#0ea5e9] text-white px-8 py-3 rounded-2xl font-black transition-all hover:bg-[#0284c7] hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-sky-500/25 text-sm flex items-center gap-2.5"
                    >
                        <Plus size={22} />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Incomplete Leads List */}
            <div className="flex-1 flex flex-col min-h-0 space-y-4 pb-12">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#0f1c2e] leading-tight">Pending Approvals</h2>
                            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{incompleteLeads.length} leads waiting for verification</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-1 sm:flex-none justify-end">
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" size={17} />
                            <input
                                type="text"
                                placeholder="Search by URL or Company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-8 focus:ring-[#0ea5e9]/5 focus:border-[#0ea5e9] transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => fetchIncompleteLeads(searchTerm)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#0ea5e9] hover:bg-sky-50 transition-all shadow-sm"
                        >
                            <RefreshCw size={20} className={fetching ? 'animate-spin text-[#0ea5e9]' : ''} />
                        </button>
                    </div>
                </div>

                {/* Sub-tabs for POC Approval */}
                <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl self-start">
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'leads'
                            ? 'bg-white text-[#0ea5e9] shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Pending Leads
                    </button>
                    <button
                        onClick={() => setActiveTab('pocs')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pocs'
                            ? 'bg-white text-[#0ea5e9] shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Pending Contacts
                    </button>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.15em]">
                                        {activeTab === 'leads' ? 'Website / Company' : 'POC Detail'}
                                    </th>
                                    <th className="px-8 py-5 text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.15em]">
                                        {activeTab === 'leads' ? 'Assignee' : 'Company'}
                                    </th>
                                    <th className="px-8 py-5 text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.15em]">Submission Date</th>
                                    <th className="px-8 py-5 text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {fetching && incompleteLeads.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-lg w-48"></div></td>
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-lg w-32"></div></td>
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-lg w-24"></div></td>
                                            <td className="px-8 py-6 text-right"><div className="h-10 bg-slate-100 rounded-xl w-28 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : (activeTab === 'leads' ? incompleteLeads.filter(l => l.status === 'incomplete') :
                                    incompleteLeads.flatMap(l => (l.points_of_contact || [])
                                        .filter(p => p.approvalStatus === 'pending')
                                        .map(p => ({ ...p, lead: l }))
                                    )).length > 0 ? (
                                    (activeTab === 'leads' ?
                                        incompleteLeads.filter(l => l.status === 'incomplete') :
                                        incompleteLeads.flatMap(l => (l.points_of_contact || [])
                                            .filter(p => p.approvalStatus === 'pending')
                                            .map(p => ({ ...p, lead: l }))
                                        )
                                    ).map((item: any) => (
                                        <tr key={activeTab === 'leads' ? item._id : item._id} className="hover:bg-slate-50/70 transition-all group">
                                            <td className="px-8 py-6">
                                                {activeTab === 'leads' ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#0ea5e9] border border-sky-100/50 shadow-sm group-hover:bg-[#0ea5e9] group-hover:text-white transition-all">
                                                            <Globe size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-black text-[#0f1c2e] block">{item.website_url}</span>
                                                            <span className="text-[0.65rem] font-bold text-slate-400">{item.company_name || 'Incomplete Details'}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/50 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                            <CheckCircle size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-black text-[#0f1c2e] block">{item.name}</span>
                                                            <span className="text-[0.65rem] font-bold text-slate-400">{item.phone}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                {activeTab === 'leads' ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[0.6rem]">
                                                            {item.assignedBy?.name?.[0]}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 underline decoration-sky-100 underline-offset-4">{item.assignedBy?.name || 'Self'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-600">{item.lead.company_name || 'No Name'}</span>
                                                        <span className="text-[0.65rem] font-medium text-[#0ea5e9] underline underline-offset-2">{item.lead.website_url}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[0.7rem] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    {new Date(activeTab === 'leads' ? item.createdAt : item.lead.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {activeTab === 'leads' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(item._id)}
                                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#0ea5e9]/10 hover:text-[#0ea5e9] transition-all border border-slate-100"
                                                                title="Edit Lead"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item._id)}
                                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                                                                title="Delete Lead"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            {JSON.parse(localStorage.getItem('user') || '{}')?.role === 'Admin' && (
                                                                <button
                                                                    onClick={() => handleApprove(item._id)}
                                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0ea5e9]/5 text-[#0ea5e9] rounded-xl hover:bg-[#0ea5e9] hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-lg hover:shadow-sky-500/25 border border-[#0ea5e9]/10"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Approve
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditPoc(item.lead._id)}
                                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#0ea5e9]/10 hover:text-[#0ea5e9] transition-all border border-slate-100"
                                                                title="Edit Contact"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePoc(item.lead._id, item._id, item.name)}
                                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                                                                title="Delete Contact"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            {JSON.parse(localStorage.getItem('user') || '{}')?.role === 'Admin' && (
                                                                <button
                                                                    onClick={() => handleApprovePoc(item.lead._id, item._id)}
                                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-[0.65rem] font-black uppercase tracking-widest shadow-sm hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-100"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                    Approve
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl mb-4 flex items-center justify-center text-slate-200 border border-slate-100">
                                                    <AlertCircle size={40} />
                                                </div>
                                                <h4 className="text-lg font-black text-[#0f1c2e]">{searchTerm ? 'No results found' : 'Queue clear!'}</h4>
                                                <p className="text-slate-400 font-bold text-sm max-w-[240px] mt-2">
                                                    {searchTerm ? `Nothing matches "${searchTerm}" in pending ${activeTab === 'pocs' ? 'contacts' : 'leads'}.` : `No pending ${activeTab === 'pocs' ? 'contacts' : 'leads'} require approval at the moment.`}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AddIncompleteLeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => fetchIncompleteLeads(searchTerm)}
                leadId={selectedLeadId}
                isPocOnly={isPocOnlyMode}
            />

            {/* Check URL Modal */}
            {isCheckModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0ea5e9]">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#0f1c2e]">Check Website</h3>
                                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Verify lead existence before adding POC</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Company Website URL</label>
                                <input
                                    type="text"
                                    placeholder="example.com"
                                    value={checkUrl}
                                    onChange={(e) => setCheckUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#0ea5e9]/10 focus:border-[#0ea5e9] transition-all"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCheckUrl()}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsCheckModalOpen(false);
                                        setCheckUrl('');
                                    }}
                                    className="flex-1 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCheckUrl}
                                    disabled={checking}
                                    className="flex-1 bg-[#0ea5e9] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-[#0284c7] shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {checking && <RefreshCw size={14} className="animate-spin" />}
                                    {checking ? 'Checking...' : 'Check & Proceed'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddLeadTab;
