import React, { useEffect, useState } from 'react';
import {
    X, Plus, Trash2, Mail, Phone, Laptop, Smartphone,
    Globe, User, Linkedin,
    Calendar, CheckCircle2, MessageSquare,
    LayoutPanelTop, Check, Pencil, ClipboardList, TrendingUp,
    ArrowRightLeft, UserCheck, UserMinus, RefreshCw, CheckCheck,
    History, BarChart3, ChevronDown, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import PostCallFeedbackModal from './PostCallFeedbackModal';
import TaskModal from './TaskModal';
import RemarkModal from './RemarkModal';
import { API_BASE_URL } from '../../config';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    initialMode?: 'view' | 'edit' | 'create';
    onUpdate: () => void;
}

interface UserSummary {
    _id: string;
    name: string;
}

const STAGES = [
    "New",
    "Contacted",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Lost",
    "Onboarded",
    "No vendor",
    "Future Reference"
];

const POC_STAGES = ["New", "Contacted", "Busy", "No Answer", "Wrong Number"];

const LeadModal: React.FC<Props> = ({ isOpen, onClose, leadId, initialMode = 'view', onUpdate }) => {
    const currentUserData = localStorage.getItem('user');
    const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
    const isBDExecutive = currentUser?.role === 'BD Executive';

    const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
    const [lead, setLead] = useState<any>(null);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        company_name: '',
        company_email: '',
        website_url: '',
        company_size: '',
        industry_name: '',
        linkedin_link: '',
        stage: 'New',
        assignedBy: '',
        assignedTo: [] as string[],
        points_of_contact: [{ name: '', designation: '', phone: '', email: '', linkedin_url: '', stage: 'New' }]
    });

    // Tab state
    const [activeTab, setActiveTab] = useState<'poc' | 'remarks' | 'tasks' | 'activity' | 'overall'>('poc');
    const [tasks, setTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);

    // Post-call feedback state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [activePocForFeedback, setActivePocForFeedback] = useState<any>(null);

    // Task modal state
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [activeTaskForEdit, setActiveTaskForEdit] = useState<any>(null);
    const [activePocForRemark, setActivePocForRemark] = useState<any>(null);

    // Bucket state
    const [bucketIds, setBucketIds] = useState<string[]>([]);
    const [bucketLoading, setBucketLoading] = useState<string | null>(null);

    // Selected Tasks for Bulk Action
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

    // Call history overlay state
    const [showCallHistory, setShowCallHistory] = useState(false);

    // Schedule dropdown state
    const [activeSchedulePocId, setActiveSchedulePocId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchBucket();
        }
    }, [isOpen]);

    const fetchBucket = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/poc-bucket`, {
                headers: { 'x-auth-token': token || '' }
            });
            if (response.ok) {
                const data = await response.json();
                setBucketIds(data.map((item: any) => item.pocId));
            }
        } catch (err) {
            console.error('Fetch bucket error:', err);
        }
    };

    const handleAddToBucket = async (poc: any) => {
        try {
            setBucketLoading(poc._id);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/poc-bucket/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({
                    leadId: leadId,
                    pocId: poc._id,
                    name: poc.name,
                    designation: poc.designation,
                    phone: poc.phone,
                    email: poc.email,
                    company_name: lead.company_name
                })
            });

            if (response.ok) {
                toast.success('Added to pipeline');
                setBucketIds(prev => [...prev, poc._id]);
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to add to pipeline');
            }
        } catch (err) {
            toast.error('Failed to add to pipeline');
        } finally {
            setBucketLoading(null);
        }
    };

    useEffect(() => {
        if (isOpen && leadId) {
            fetchTasks();
            fetchActivities();
        }
    }, [isOpen, leadId]);

    const fetchTasks = async () => {
        try {
            setTasksLoading(true);
            setSelectedTaskIds([]); // Clear selection on refresh
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/lead/${leadId}`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await response.json();
            if (response.ok) setTasks(data);
        } catch (err) {
            console.error('Fetch tasks error:', err);
        } finally {
            setTasksLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            setActivitiesLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/activities`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await response.json();
            if (response.ok) setActivities(data);
        } catch (err) {
            console.error('Fetch activities error:', err);
        } finally {
            setActivitiesLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            fetchUsers();
            if (leadId && initialMode !== 'create') {
                fetchLeadDetails();
            } else if (initialMode === 'create') {
                const currentUserData = localStorage.getItem('user');
                const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
                const currentUserId = currentUser?._id || currentUser?.id || '';

                setLead(null);
                setFormData({
                    company_name: '',
                    company_email: '',
                    website_url: '',
                    company_size: '',
                    industry_name: '',
                    linkedin_link: '',
                    stage: 'New',
                    assignedBy: currentUserId,
                    assignedTo: currentUserId ? [currentUserId] : [],
                    points_of_contact: [{ name: '', designation: '', phone: '', email: '', linkedin_url: '', stage: 'New' }]
                });
            }
        }
    }, [isOpen, leadId, initialMode]);

    const fetchLeadDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setLead(data);
            setFormData({
                company_name: data.company_name || '',
                company_email: data.company_email || '',
                website_url: data.website_url || '',
                company_size: data.company_size || '',
                industry_name: data.industry_name || '',
                linkedin_link: data.linkedin_link || '',
                stage: data.stage || 'New',
                assignedBy: data.assignedBy?._id || '',
                assignedTo: data.assignedTo?.map((u: any) => u._id) || [],
                points_of_contact: data.points_of_contact?.length
                    ? data.points_of_contact.map((poc: any) => ({ ...poc, linkedin_url: poc.linkedin_url || '' }))
                    : [{ name: '', designation: '', phone: '', email: '', linkedin_url: '', stage: 'New' }]
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/auth/users/list`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await response.json();
            if (response.ok) setUsers(data);
        } catch (err) { }
    };

    const handleSave = async (dataToSave: any = formData) => {
        try {
            // Guard against React synthetic events being passed instead of data object
            if (dataToSave && dataToSave.nativeEvent) {
                dataToSave = formData;
            }

            // Validation
            if (!dataToSave.company_name || !dataToSave.website_url || !dataToSave.assignedBy) {
                toast.error('Please fill in required fields: Company Name, Website, and Assigned Person');
                return;
            }

            // POC Validation & Uniqueness
            if (!dataToSave.points_of_contact || dataToSave.points_of_contact.length === 0) {
                toast.error('At least one Point of Contact is mandatory');
                return;
            }

            const phones = new Set();
            const emails = new Set();
            for (const poc of dataToSave.points_of_contact) {
                if (!poc.name) {
                    toast.error('Point of Contact Name is mandatory');
                    return;
                }
                // Only enforce phone for approved POCs. Pending ones can be partially filled.
                if (poc.approvalStatus !== 'pending' && !poc.phone) {
                    toast.error(`Phone number is mandatory for approved contact: ${poc.name}`);
                    return;
                }
                if (poc.phone && phones.has(poc.phone)) {
                    toast.error(`Duplicate phone number in contacts: ${poc.phone}`);
                    return;
                }
                if (poc.email && emails.has(poc.email)) {
                    toast.error(`Duplicate email in contacts: ${poc.email}`);
                    return;
                }
                phones.add(poc.phone);
                if (poc.email) emails.add(poc.email);
            }

            setSaving(true);
            const token = localStorage.getItem('token');
            const isCreate = mode === 'create';
            const url = isCreate
                ? `${API_BASE_URL}/api/leads`
                : `${API_BASE_URL}/api/leads/${leadId}`;

            const payload = {
                ...dataToSave,
                status: isCreate ? (isBDExecutive ? 'incomplete' : 'approved') : undefined
            };

            const response = await fetch(url, {
                method: isCreate ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to process lead');
            }

            toast.success(isCreate ? 'Lead created successfully' : 'Lead updated successfully');
            if (!isCreate) {
                fetchLeadDetails();
            } else {
                onUpdate();
                onClose();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const addPOC = () => {
        setFormData({
            ...formData,
            points_of_contact: [...formData.points_of_contact, { name: '', designation: '', phone: '', email: '', linkedin_url: '', stage: 'New' }]
        });
    };

    const removePOC = async (index: number) => {
        const poc = formData.points_of_contact[index];

        if (!window.confirm('Are you sure you want to remove this Point of Contact? This action is immediate.')) {
            return;
        }

        // If POC is already in DB, delete it via API
        if (poc._id && leadId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/poc/${poc._id}`, {
                    method: 'DELETE',
                    headers: { 'x-auth-token': token || '' }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to delete POC');
                }

                toast.success('Point of Contact removed permanently');
                fetchLeadDetails(); // Refresh everything from DB
                return;
            } catch (err: any) {
                toast.error(err.message);
                return;
            }
        }

        // For new POCs (frontend only), just filter them out
        const newPOCs = formData.points_of_contact.filter((_: any, i: number) => i !== index);
        setFormData({
            ...formData,
            points_of_contact: newPOCs.length ? newPOCs : [{ name: '', designation: '', phone: '', email: '', linkedin_url: '', stage: 'New' }]
        });
    };

    const updatePOC = (index: number, field: string, value: string) => {
        const newPOCs = [...formData.points_of_contact];
        newPOCs[index] = { ...newPOCs[index], [field]: value };
        setFormData({ ...formData, points_of_contact: newPOCs });
    };

    const handleCallAction = (poc: any) => {
        // 1. Trigger the device dialer
        window.location.href = `tel:${poc.phone}`;

        // 2. Prepare and show the feedback modal
        setActivePocForFeedback(poc);
        setShowFeedbackModal(true);
    };

    const handleToggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ completed: !currentStatus })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update task status');
            }

            toast.success(currentStatus ? 'Task marked as incomplete' : 'Task completed!');
            fetchTasks();
            fetchActivities(); // Refresh activities to show completion event
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleBulkDeleteTasks = async () => {
        if (!selectedTaskIds.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/bulk`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ taskIds: selectedTaskIds, leadId })
            });

            if (response.ok) {
                toast.success('Tasks deleted successfully');
                fetchTasks();
                fetchActivities();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete tasks');
            }
        } catch (err) {
            toast.error('Server error during bulk delete');
        }
    };

    const handleBulkDoneTasks = async () => {
        if (!selectedTaskIds.length) return;

        // Filter out tasks that are already completed
        const tasksToComplete = tasks.filter((t: any) => selectedTaskIds.includes(t._id) && !t.completed);

        if (!tasksToComplete.length) {
            toast.success('Selected tasks are already completed');
            setSelectedTaskIds([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/bulk`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ taskIds: tasksToComplete.map((t: any) => t._id), leadId })
            });

            if (response.ok) {
                toast.success('Tasks marked as completed');
                fetchTasks();
                fetchActivities();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to complete tasks');
            }
        } catch (err) {
            toast.error('Server error during bulk update');
        }
    };

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const toggleSelectAllTasks = () => {
        if (selectedTaskIds.length === tasks.length) {
            setSelectedTaskIds([]);
        } else {
            setSelectedTaskIds(tasks.map((t: any) => t._id));
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'poc':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Persons</h4>
                            {mode !== 'view' && (
                                <button onClick={addPOC} className="text-xs font-bold text-[#0ea5e9] flex items-center gap-1 hover:underline">
                                    <Plus size={14} /> Add New POC
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {mode === 'view' ? (
                                (lead?.points_of_contact || [])
                                    .filter((p: any) => p.approvalStatus !== 'pending')
                                    .map((poc: any, idx: number) => (
                                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0ea5e9] group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-800">{poc.name}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase ${poc.stage === 'Contacted' ? 'bg-emerald-100 text-emerald-700' :
                                                            poc.stage === 'Busy' ? 'bg-amber-100 text-amber-700' :
                                                                poc.stage === 'No Answer' ? 'bg-rose-100 text-rose-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {poc.stage || 'New'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[0.65rem] font-medium text-slate-400 uppercase tracking-wider">{poc.designation || 'Position N/A'}</p>
                                                    {tasks.some((t: any) => t.poc_id === poc._id && !t.completed) && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                            <p className="text-[0.65rem] font-bold text-amber-600">Pending Follow-up</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3.5">
                                                <button onClick={() => handleCallAction(poc)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#0ea5e9]/10 hover:text-[#0ea5e9] transition-all">
                                                    <Phone size={16} />
                                                </button>
                                                <a href={`mailto:${poc.email}`} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#0ea5e9]/10 hover:text-[#0ea5e9] transition-all">
                                                    <Mail size={16} />
                                                </a>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveSchedulePocId(activeSchedulePocId === poc._id ? null : poc._id)}
                                                        className={`p-2.5 rounded-xl transition-all ${activeSchedulePocId === poc._id ? 'bg-[#0ea5e9] text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-[#0ea5e9]/10 hover:text-[#0ea5e9]'}`}
                                                        title="Schedule Meeting"
                                                    >
                                                        <Calendar size={16} />
                                                    </button>
                                                    {activeSchedulePocId === poc._id && (
                                                        <div className="absolute top-12 right-0 bg-white rounded-xl border border-slate-200 shadow-xl p-2 z-50 min-w-[140px] animate-in zoom-in-95 duration-200">
                                                            <a
                                                                href={`https://calendar.google.com/calendar/r/eventedit?text=Meeting+with+${encodeURIComponent(poc.name)}&add=${encodeURIComponent(poc.email)}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-[0.7rem] font-bold text-slate-600 transition-colors"
                                                                onClick={() => setActiveSchedulePocId(null)}
                                                            >
                                                                <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-500"><Calendar size={12} /></div>
                                                                Google Meet
                                                            </a>
                                                            <a
                                                                href={`https://outlook.office.com/calendar/0/deeplink/compose?subject=Meeting+with+${encodeURIComponent(poc.name)}&body=Meeting+discussion&to=${encodeURIComponent(poc.email)}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-[0.7rem] font-bold text-slate-600 transition-colors"
                                                                onClick={() => setActiveSchedulePocId(null)}
                                                            >
                                                                <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-500"><Calendar size={12} /></div>
                                                                Outlook Meet
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setActivePocForRemark(poc);
                                                        setShowRemarkModal(true);
                                                    }}
                                                    className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                                {/* LinkedIn icon... */}
                                                {poc.linkedin_url && (
                                                    <a href={poc.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#0077b5]/10 hover:text-[#0077b5] transition-all">
                                                        <Linkedin size={16} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleAddToBucket(poc)}
                                                    disabled={bucketIds.includes(poc._id) || bucketLoading === poc._id}
                                                    className={`p-2.5 rounded-xl transition-all ${bucketIds.includes(poc._id)
                                                        ? 'bg-emerald-50 text-emerald-500 cursor-default'
                                                        : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white'
                                                        }`}
                                                    title={bucketIds.includes(poc._id) ? 'Added to Pipeline' : 'Add to Pipeline'}
                                                >
                                                    {bucketLoading === poc._id ? (
                                                        <div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                                    ) : bucketIds.includes(poc._id) ? (
                                                        <Check size={16} />
                                                    ) : (
                                                        <LayoutPanelTop size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                formData.points_of_contact.map((poc: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm relative group">
                                        <button onClick={() => removePOC(idx)} className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Full Name</label>
                                                <input type="text" value={poc.name} onChange={(e) => updatePOC(idx, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Designation</label>
                                                <input type="text" value={poc.designation} onChange={(e) => updatePOC(idx, 'designation', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Phone</label>
                                                <input type="text" value={poc.phone} onChange={(e) => updatePOC(idx, 'phone', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Email</label>
                                                <input type="email" value={poc.email} onChange={(e) => updatePOC(idx, 'email', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[0.6rem] font-bold text-slate-400 uppercase">LinkedIn URL</label>
                                                <input type="text" value={poc.linkedin_url} onChange={(e) => updatePOC(idx, 'linkedin_url', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[0.6rem] font-bold text-slate-400 uppercase">Status</label>
                                                <select value={poc.stage} onChange={(e) => updatePOC(idx, 'stage', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold">
                                                    {POC_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            case 'remarks':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Communication History</h4>
                            <button
                                onClick={() => {
                                    // If there's at least one POC, use the first one as default for the remark
                                    const firstPoc = (lead?.points_of_contact || []).filter((p: any) => p.approvalStatus !== 'pending')[0];
                                    if (firstPoc) {
                                        setActivePocForRemark(firstPoc);
                                        setShowRemarkModal(true);
                                    } else {
                                        toast.error('No approved contacts to add a remark for.');
                                    }
                                }}
                                className="text-xs font-bold text-emerald-500 flex items-center gap-1 hover:underline"
                            >
                                <Plus size={14} /> Add Remark
                            </button>
                        </div>
                        <div className="space-y-4">
                            {lead?.remarks?.length ? (
                                [...lead.remarks].reverse().map((remark: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#0ea5e9]/20 group-hover:bg-[#0ea5e9] transition-colors"></div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-[0.65rem] font-bold">
                                                    {remark.profile?.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[0.7rem] font-bold text-slate-800">{remark.profile?.name}</p>
                                                    <p className="text-[0.6rem] text-slate-400 font-medium">{new Date(remark.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-100 text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest">
                                                {remark.type || 'text'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {remark.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <MessageSquare size={32} className="text-slate-200 mb-3" />
                                    <p className="text-sm font-bold text-slate-400 italic">No remarks noted yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'tasks':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actionable Tasks</h4>
                                {tasks.length > 0 && (
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            onClick={toggleSelectAllTasks}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedTaskIds.length === tasks.length && tasks.length > 0
                                                ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white'
                                                : 'bg-white border-slate-200'
                                                }`}
                                        >
                                            {selectedTaskIds.length === tasks.length && tasks.length > 0 && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        <span className="text-[0.65rem] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider">Select All</span>
                                    </label>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedTaskIds.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleBulkDoneTasks}
                                            className="text-[0.65rem] font-black text-emerald-500 hover:text-emerald-600 flex items-center gap-1.5 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-emerald-100 shadow-sm"
                                        >
                                            <CheckCircle2 size={12} /> Mark Done ({selectedTaskIds.length})
                                        </button>
                                        <button
                                            onClick={handleBulkDeleteTasks}
                                            className="text-[0.65rem] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1.5 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg transition-all border border-rose-100 shadow-sm"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setActiveTaskForEdit(null);
                                        setShowTaskModal(true);
                                    }}
                                    className="text-xs font-bold text-[#0ea5e9] flex items-center gap-1 hover:underline"
                                >
                                    <Plus size={14} /> Create Task
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {tasksLoading ? (
                                <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin"></div></div>
                            ) : tasks.length ? (
                                tasks.map((task: any) => (
                                    <div key={task._id} className={`bg-white border ${task.completed ? 'border-emerald-100' : selectedTaskIds.includes(task._id) ? 'border-[#0ea5e9] bg-sky-50/30' : 'border-slate-100'} rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group/task`}>
                                        <div className="flex items-center gap-4">
                                            <div
                                                onClick={() => toggleTaskSelection(task._id)}
                                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedTaskIds.includes(task._id)
                                                    ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white'
                                                    : 'border-slate-200 text-transparent hover:border-[#0ea5e9]'
                                                    }`}
                                            >
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <button
                                                onClick={() => handleToggleTaskCompletion(task._id, task.completed)}
                                                className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-[#0ea5e9]'
                                                    }`}>
                                                <CheckCircle2 size={14} />
                                            </button>
                                            <div>
                                                <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                    <span className="flex items-center gap-1 text-[0.65rem] font-bold text-slate-400">
                                                        <Calendar size={12} /> {new Date(task.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                    {task.user_id && (
                                                        <span className="flex items-center gap-1 text-[0.65rem] font-bold text-indigo-500">
                                                            <UserCheck size={12} /> {task.user_id.name || 'Assigned'}
                                                        </span>
                                                    )}

                                                    {task.poc_id && lead.points_of_contact && (
                                                        <span className="flex items-center gap-1 text-[0.65rem] font-bold text-[#0ea5e9]">
                                                            <User size={12} /> {lead.points_of_contact.find((p: any) => p._id === task.poc_id)?.name || 'Contact'}
                                                        </span>
                                                    )}
                                                    {task.type && (
                                                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">
                                                            {task.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setActiveTaskForEdit(task);
                                                setShowTaskModal(true);
                                            }}
                                            className="p-2 text-slate-300 hover:text-[#0ea5e9] transition-colors"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <ClipboardList size={32} className="text-slate-200 mb-3" />
                                    <p className="text-sm font-bold text-slate-400 italic">No tasks assigned yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'activity':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Activity Timeline</h4>
                        {activitiesLoading ? (
                            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin"></div></div>
                        ) : activities.length > 0 ? (
                            <div className="relative pl-8 space-y-6 before:absolute before:top-0 before:left-[11px] before:w-0.5 before:h-full before:bg-slate-100">
                                {activities.map((activity: any, idx: number) => {
                                    // Config for each activity type
                                    const config: Record<string, { icon: React.ElementType; bg: string; label: string }> = {
                                        'Lead Created': { icon: TrendingUp, bg: 'bg-sky-500', label: 'Lead Created' },
                                        'Lead Updated': { icon: Pencil, bg: 'bg-blue-400', label: 'Lead Updated' },
                                        'Stage Changed': { icon: ArrowRightLeft, bg: 'bg-violet-500', label: 'Stage Changed' },
                                        'Reassigned': { icon: UserCheck, bg: 'bg-indigo-400', label: 'Reassigned' },
                                        'POC Added': { icon: User, bg: 'bg-emerald-500', label: 'Contact Added' },
                                        'POC Updated': { icon: Pencil, bg: 'bg-teal-400', label: 'Contact Updated' },
                                        'POC Removed': { icon: UserMinus, bg: 'bg-rose-400', label: 'Contact Removed' },
                                        'Call Logged': { icon: Phone, bg: 'bg-green-500', label: 'Call Logged' },
                                        'Task Created': { icon: ClipboardList, bg: 'bg-amber-400', label: 'Task Created' },
                                        'Task Updated': { icon: Pencil, bg: 'bg-orange-400', label: 'Task Updated' },
                                        'Task Completed': { icon: CheckCheck, bg: 'bg-emerald-500', label: 'Task Completed' },
                                        'Task Reopened': { icon: RefreshCw, bg: 'bg-yellow-400', label: 'Task Reopened' },
                                        'Task Deleted': { icon: Trash2, bg: 'bg-red-400', label: 'Task Deleted' },
                                        'Remark Added': { icon: MessageSquare, bg: 'bg-slate-400', label: 'Remark Added' },
                                        'Bulk Upload': { icon: History, bg: 'bg-cyan-500', label: 'Bulk Upload' },
                                    };
                                    const c = config[activity.type] || { icon: History, bg: 'bg-slate-300', label: activity.type };
                                    const Icon = c.icon;
                                    return (
                                        <div key={activity._id || idx} className="relative group">
                                            <div className={`absolute -left-[27px] top-1 w-6 h-6 rounded-full ${c.bg} border-4 border-white shadow-sm flex items-center justify-center`}>
                                                <Icon size={10} className="text-white" />
                                            </div>
                                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start gap-3 mb-1">
                                                    <p className="text-[0.7rem] font-black text-slate-800 uppercase tracking-wide">{c.label}</p>
                                                    <p className="text-[0.6rem] text-slate-400 font-bold shrink-0">{new Date(activity.timestamp).toLocaleString()}</p>
                                                </div>
                                                <p className="text-[0.7rem] text-slate-600 font-medium leading-relaxed">{activity.description}</p>
                                                {activity.performedByName && activity.performedByName !== 'System' && (
                                                    <p className="text-[0.6rem] text-slate-400 font-medium mt-1.5">
                                                        By: <span className="font-bold text-slate-500">{activity.performedByName}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <History size={32} className="text-slate-200 mb-3" />
                                <p className="text-sm font-bold text-slate-400 italic">No activity recorded yet.</p>
                                <p className="text-[0.65rem] text-slate-300 mt-1">Actions on this lead will appear here.</p>
                            </div>
                        )}
                    </div>
                );
            case 'overall':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center text-center shadow-sm">
                                <p className="text-2xl font-black text-slate-800">{lead?.points_of_contact?.length || 0}</p>
                                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Contacts</p>
                            </div>
                            <button
                                onClick={() => setShowCallHistory(true)}
                                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center text-center hover:bg-[#0ea5e9]/5 hover:border-[#0ea5e9]/20 transition-all group shadow-sm"
                            >
                                <p className="text-2xl font-black text-[#0ea5e9] group-hover:scale-110 transition-transform">{activities.filter(a => a.type === 'Call Logged').length}</p>
                                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                    Calls Made <ArrowRightLeft size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                            </button>
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center text-center shadow-sm">
                                <p className="text-2xl font-black text-slate-800">{lead?.remarks?.length || 0}</p>
                                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Remarks</p>
                            </div>
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center text-center shadow-sm">
                                <p className="text-2xl font-black text-amber-500">{tasks.filter((t: any) => !t.completed).length}</p>
                                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Pending Tasks</p>
                            </div>
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center text-center shadow-sm">
                                <p className="text-2xl font-black text-emerald-500">Won</p>
                                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Probability</p>
                            </div>
                        </div>

                        {/* Call History Details Overlay */}
                        {showCallHistory && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="bg-slate-50 rounded-3xl border-2 border-[#0ea5e9]/10 overflow-hidden shadow-inner">
                                    <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-[#0ea5e9]/10 rounded-lg text-[#0ea5e9]">
                                                <Phone size={14} />
                                            </div>
                                            <h5 className="text-[0.65rem] font-black text-slate-800 uppercase tracking-widest">Detailed Call Logs</h5>
                                        </div>
                                        <button onClick={() => setShowCallHistory(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-3">
                                        {activities.filter(a => a.type === 'Call Logged').length > 0 ? (
                                            activities.filter(a => a.type === 'Call Logged').map((call: any, cIdx: number) => (
                                                <div key={cIdx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start justify-between gap-4 group">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#0ea5e9] group-hover:bg-[#0ea5e9] group-hover:text-white transition-all">
                                                            {call.performedByName?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[0.7rem] font-black text-slate-800 uppercase">{call.performedByName}</span>
                                                                <span className="text-[0.6rem] font-bold text-slate-300">called</span>
                                                                <span className="text-[0.7rem] font-black text-[#0ea5e9] uppercase tracking-wide">
                                                                    {call.description.match(/Called "([^"]+)"/)?.[1] || 'Contact'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[0.65rem] text-slate-500 font-medium leading-relaxed italic">
                                                                "{call.description.split('. Remark: ')?.[1]?.replace(/"/g, '') || 'No additional remarks provided.'}"
                                                            </p>
                                                            <div className="mt-2 text-[0.6rem] font-bold text-slate-400 flex items-center flex-wrap gap-x-3 gap-y-1.5">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={10} /> {new Date(call.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                                </span>
                                                                {call.metadata?.device && (
                                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[#0ea5e9]">
                                                                        {call.metadata.device === 'Mobile' ? <Smartphone size={10} /> : <Laptop size={10} />}
                                                                        {call.metadata.device}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-0.5 rounded-lg text-[0.55rem] font-black uppercase tracking-widest ${call.description.includes('Contacted') ? 'bg-emerald-50 text-emerald-600' :
                                                        call.description.includes('Busy') ? 'bg-amber-50 text-amber-600' :
                                                            call.description.includes('No Answer') ? 'bg-rose-50 text-rose-600' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {call.description.match(/Status set to "([^"]+)"/)?.[1] || 'Logged'}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-xs font-bold text-slate-400 italic">No call activities recorded yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-span-full bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[0.7rem] font-black text-amber-800 uppercase tracking-[0.1em] mb-1">Executive Summary</p>
                                <p className="text-[0.65rem] text-amber-700/80 font-medium leading-relaxed">
                                    Lead is currently in the <span className="font-bold">{lead?.stage}</span> stage with {lead?.points_of_contact?.length} active touchpoints.
                                    Last interaction was noted on {lead?.remarks?.[lead.remarks.length - 1]?.created_at ? new Date(lead.remarks[lead.remarks.length - 1].created_at).toLocaleDateString() : 'N/A'}.
                                    Recommended next step: Complete all pending tasks to accelerate conversion.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={`fixed inset-0 z-[60] flex justify-center items-start p-0 sm:p-8 ${showFeedbackModal ? 'overflow-hidden' : 'overflow-y-auto'} bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200`}>
                <div className="relative w-full max-w-4xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 min-h-full sm:min-h-0 sm:my-auto">
                    {/* Header - Sticky */}
                    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-between shadow-sm">
                        <div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-[#0f1c2e] leading-tight">
                                {mode === 'create' ? 'Create Lead' : mode === 'edit' ? 'Edit Lead' : 'Lead Details'}
                            </h2>
                            {leadId && (
                                <p className="text-slate-500 text-[0.65rem] mt-0.5 font-medium italic">#{leadId}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {mode === 'view' ? (
                                <button
                                    onClick={() => setMode('edit')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSave()}
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <CheckCircle2 size={14} />
                                    )}
                                    {saving ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Save Changes'}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 sm:p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold text-sm">Loading complete dossier...</p>
                            </div>
                        ) : (mode === 'view' && !lead) ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <p className="text-slate-400 font-bold text-sm">Lead details not found.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-10">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* LEFT SIDE: COMPANY OVERVIEW */}
                                    <section className="lg:col-span-8 bg-slate-50/50 border border-slate-100 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 h-full">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                                                <Globe size={18} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Company Overview</h3>
                                        </div>

                                        {mode === 'view' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                                                <div className="space-y-1.5 group">
                                                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.1em]">Company Name</label>
                                                    <p className="text-base font-extrabold text-[#0f1c2e] group-hover:text-[#0ea5e9] transition-colors">{lead.company_name}</p>
                                                </div>
                                                <div className="space-y-1.5 group">
                                                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.1em]">Website</label>
                                                    <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-base font-extrabold text-[#0ea5e9] hover:underline flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                                        <Globe size={16} className="shrink-0" /> {lead.website_url.replace('https://', '').replace('http://', '')}
                                                    </a>
                                                </div>
                                                <div className="space-y-1.5 group">
                                                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.1em]">Industry</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        <p className="text-sm font-bold text-slate-700">{lead.industry_name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 group">
                                                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.1em]">Company Size</label>
                                                    <p className="text-sm font-bold text-slate-700">{lead.company_size || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1.5 group">
                                                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.1em]">Company Email</label>
                                                    <p className="text-sm font-bold text-slate-700 overflow-hidden text-ellipsis">{lead.company_email || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1.5 group">
                                                    <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.1em]">LinkedIn</label>
                                                    {lead.linkedin_link ? (
                                                        <a href={lead.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0077b5] hover:underline flex items-center gap-2">
                                                            <Linkedin size={16} className="shrink-0" /> Company Profile
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-300 italic">No link available</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Company Name *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.company_name}
                                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#0f1c2e] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all border-b-4 border-b-slate-100"
                                                        placeholder="Acme Corp"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Website URL *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.website_url}
                                                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                                        disabled={isBDExecutive && mode === 'edit'}
                                                        className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#0f1c2e] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all border-b-4 border-b-slate-100 ${isBDExecutive && mode === 'edit' ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
                                                        placeholder="acme.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Industry</label>
                                                    <input
                                                        type="text"
                                                        value={formData.industry_name}
                                                        onChange={(e) => setFormData({ ...formData, industry_name: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#0f1c2e] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all border-b-4 border-b-slate-100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Company Size</label>
                                                    <input
                                                        type="text"
                                                        value={formData.company_size}
                                                        onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#0f1c2e] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all border-b-4 border-b-slate-100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Company Email</label>
                                                    <input
                                                        type="email"
                                                        value={formData.company_email}
                                                        onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#0f1c2e] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all border-b-4 border-b-slate-100"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">LinkedIn Link</label>
                                                    <input
                                                        type="text"
                                                        value={formData.linkedin_link}
                                                        onChange={(e) => setFormData({ ...formData, linkedin_link: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#0f1c2e] focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all border-b-4 border-b-slate-100"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {/* RIGHT SIDE: LEAD STATUS & ASSIGNMENT */}
                                    <section className="lg:col-span-4 p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all h-full">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                <TrendingUp size={18} />
                                            </div>
                                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Status & Assign</h2>
                                        </div>

                                        <div className="space-y-6">
                                            {mode === 'view' ? (
                                                <>
                                                    {/* View Mode: Read-only cards */}
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Lifecycle Stage</label>
                                                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border ${lead?.stage === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : lead?.stage === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-[#0f1c2e] border-slate-200'}`}>
                                                            <span className={`w-2 h-2 rounded-full ${lead?.stage === 'Won' ? 'bg-emerald-500' : lead?.stage === 'Lost' ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                                                            {lead?.stage || 'New'}
                                                        </div>
                                                    </div>

                                                    {lead?.createdAt && (
                                                        <div className="space-y-2">
                                                            <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Created On</label>
                                                            <p className="text-sm font-bold text-slate-700 px-1">{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {/* Edit / Create Mode: form controls */}
                                                    {/* Status Selection */}
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Lifecycle Stage</label>
                                                        <div className="relative group">
                                                            <select
                                                                value={formData.stage}
                                                                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all outline-none cursor-pointer ${formData.stage === 'Won' ? 'text-emerald-700 border-emerald-100' :
                                                                    formData.stage === 'Lost' ? 'text-rose-700 border-rose-100' :
                                                                        'text-[#0f1c2e]'
                                                                    }`}
                                                            >
                                                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-[#0ea5e9] transition-colors" size={16} />
                                                        </div>
                                                    </div>

                                                    {/* Assignment Selection */}
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider ml-1">Assigned To</label>
                                                        <div className="relative group">
                                                            <select
                                                                value={formData.assignedBy}
                                                                onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                                                                disabled={isBDExecutive}
                                                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm font-bold text-[#0f1c2e] appearance-none focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all outline-none cursor-pointer ${isBDExecutive ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="">Select User</option>
                                                                {users.map(u => (
                                                                    <option key={u._id} value={u._id}>{u.name}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0ea5e9] text-[0.55rem] font-bold shadow-sm">
                                                                {users.find(u => u._id === formData.assignedBy)?.name?.[0] || 'U'}
                                                            </div>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-[#0ea5e9] transition-colors" size={16} />
                                                        </div>
                                                    </div>

                                                    <div className="pt-2">
                                                        <button
                                                            onClick={() => handleSave()}
                                                            disabled={saving}
                                                            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-sky-500/10 active:scale-[0.98] disabled:opacity-50 text-[0.65rem] uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            {saving ? (
                                                                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                            ) : (
                                                                <CheckCircle2 size={14} />
                                                            )}
                                                            {saving ? 'Saving...' : 'Update Lead'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* SECTION 3: TABS SECTION */}
                                <section className="space-y-6">
                                    {/* Tabs Navigation */}
                                    <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 'poc', label: 'Points of Contact', icon: User },
                                            { id: 'remarks', label: 'Remarks', icon: MessageSquare },
                                            { id: 'tasks', label: 'Tasks', icon: ClipboardList },
                                            { id: 'activity', label: 'Activity Log', icon: History },
                                            { id: 'overall', label: 'Overall', icon: BarChart3 },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setActiveTab(t.id as any)}
                                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === t.id
                                                    ? 'bg-white text-[#0ea5e9] shadow-sm ring-1 ring-slate-200/50'
                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                                    }`}
                                            >
                                                <t.icon size={16} />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div className="min-h-[400px]">
                                        {renderTabContent()}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Post-Call Feedback Modal */}
            {activePocForFeedback && (
                <PostCallFeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => {
                        setShowFeedbackModal(false);
                        setActivePocForFeedback(null);
                    }}
                    leadId={leadId!}
                    poc={activePocForFeedback}
                    onSuccess={fetchLeadDetails}
                />
            )}

            <TaskModal
                isOpen={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setActiveTaskForEdit(null);
                }}
                leadId={leadId}
                taskToEdit={activeTaskForEdit}
                onSuccess={() => {
                    fetchTasks();
                    fetchActivities(); // Refresh activities to text new task creations
                }}
            />

            {showRemarkModal && activePocForRemark && (
                <RemarkModal
                    isOpen={showRemarkModal}
                    onClose={() => setShowRemarkModal(false)}
                    leadId={leadId || ''}
                    poc={activePocForRemark}
                    onSuccess={() => {
                        fetchLeadDetails();
                        fetchActivities();
                    }}
                />
            )}
        </>
    );
};

export default LeadModal;
