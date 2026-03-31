import React, { useState, useEffect } from 'react';
import { X, Phone, User, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';

interface Call {
    _id: string;
    companyName: string;
    pocName: string;
    phoneNumber: string;
    callType: string;
    timestamp: string;
    remarks: string;
    stageAfterCall: string;
}

interface AgentCallsModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
    agentName: string;
    startDate?: string;
    endDate?: string;
}

const AgentCallsModal: React.FC<AgentCallsModalProps> = ({
    isOpen,
    onClose,
    agentId,
    agentName,
    startDate,
    endDate
}) => {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && agentId) {
            fetchCalls();
        }
    }, [isOpen, agentId, startDate, endDate]);

    const fetchCalls = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL}/api/dashboard/agent-calls?agentId=${agentId}`;

            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }

            const res = await fetch(url, {
                headers: { 'x-auth-token': token || '' }
            });
            if (!res.ok) throw new Error('Failed to fetch call details');
            const json = await res.json();
            setCalls(json);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-extrabold text-[#0f1c2e] flex items-center gap-2">
                            <Phone className="text-[#0ea5e9]" size={20} />
                            Call Logs: {agentName}
                        </h2>
                        {startDate && endDate && (
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                Showing calls from <span className="text-slate-800 font-bold">{startDate}</span> to <span className="text-slate-800 font-bold">{endDate}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-[#0ea5e9]" size={32} />
                            <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Fetching call history...</p>
                        </div>
                    ) : calls.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                                        <th className="py-4 px-6">Company & POC</th>
                                        <th className="py-4 px-6">Phone Number</th>
                                        <th className="py-4 px-6">Call Details</th>
                                        <th className="py-4 px-6">Time</th>
                                        <th className="py-4 px-6">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-100">
                                    {calls.map((call) => (
                                        <tr key={call._id} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-[#0f1c2e] group-hover:text-[#0ea5e9] transition-colors">{call.companyName}</span>
                                                    <span className="text-xs text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                                                        <User size={12} className="text-slate-300" /> {call.pocName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-slate-500">{call.phoneNumber}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-[10px] font-black text-[#0ea5e9] uppercase tracking-wider w-fit">
                                                        {call.stageAfterCall}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{call.callType}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col whitespace-nowrap">
                                                    <span className="text-[11px] font-extrabold text-slate-700">
                                                        {new Date(call.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="max-w-[200px]">
                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2 italic" title={call.remarks}>
                                                        "{call.remarks}"
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Phone size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-slate-800 font-extrabold">No Calls Logged</h3>
                            <p className="text-slate-400 text-sm mt-1 max-w-[250px]">There are no call records found for this agent in the selected period.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-slate-200 text-[#0f1c2e] rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentCallsModal;
