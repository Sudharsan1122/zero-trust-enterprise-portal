import React, { useState } from 'react';
import type { JITRequest, User, Resource } from '../types';
import { api } from '../services/api';
import { Clock, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Key, Send, Copy, Check } from 'lucide-react';

interface JitTabProps {
  jitRequests: JITRequest[];
  users: User[];
  resources: Resource[];
  onRefresh: () => void;
}

export const JitTab: React.FC<JitTabProps> = ({ jitRequests, users, resources, onRefresh }) => {
  const [selectedUsername, setSelectedUsername] = useState<string>('bob.devops');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('RES-CUST-PII');
  const [duration, setDuration] = useState<number>(15);
  const [justification, setJustification] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createJitRequest({
        username: selectedUsername,
        resource_id: selectedResourceId,
        requested_duration_minutes: duration,
        business_justification: justification || 'Emergency maintenance hotfix',
      });
      setJustification('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveJit(id, 'diana.admin');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectJit(id, 'diana.admin');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-modern p-4.5">
          <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1">Active JIT Grants</div>
          <div className="text-2xl font-bold font-mono text-[#047857]">
            {jitRequests.filter(j => j.status === 'APPROVED').length}
          </div>
          <div className="text-[12px] text-[#667085] mt-1">Zero Standing Privileges Enforced</div>
        </div>

        <div className="card-modern p-4.5">
          <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1">Pending Admin Review</div>
          <div className="text-2xl font-bold font-mono text-[#b45309]">
            {jitRequests.filter(j => j.status === 'PENDING').length}
          </div>
          <div className="text-[12px] text-[#b45309] mt-1 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Diana Prince Approval Queue
          </div>
        </div>

        <div className="card-modern p-4.5">
          <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-1">Max Lease Ceiling</div>
          <div className="text-2xl font-bold font-mono text-[#7e22ce]">60 min</div>
          <div className="text-[12px] text-[#667085] mt-1">Strict Ephemeral TTL Revocation</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Elevation Form */}
        <div className="lg:col-span-5 card-modern p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eaecf0]">
            <div className="w-8 h-8 rounded-lg bg-[#faf5ff] text-[#7e22ce] flex items-center justify-center border border-[#e9d5ff]">
              <Key className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[#101828]">Request Ephemeral Privilege</h3>
              <p className="text-[12px] text-[#667085]">Just-In-Time Elevation Ticket</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1.5">
                Requester Subject
              </label>
              <select
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                className="w-full bg-white border border-[#d0d5dd] rounded-xl px-3.5 py-2.5 text-[13px] text-[#101828] shadow-xs cursor-pointer focus:border-[#2563eb] outline-none"
              >
                {users.map(u => (
                  <option key={u.username} value={u.username}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1.5">
                Target Restricted Asset
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full bg-white border border-[#d0d5dd] rounded-xl px-3.5 py-2.5 text-[13px] text-[#101828] shadow-xs cursor-pointer focus:border-[#2563eb] outline-none"
              >
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.sensitivity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1.5">
                Authorized Window (Minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-white border border-[#d0d5dd] rounded-xl px-3.5 py-2.5 text-[13px] text-[#101828] shadow-xs cursor-pointer focus:border-[#2563eb] outline-none"
              >
                <option value={15}>15 Minutes (Default Strict Least-Privilege)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (Emergency Maximum)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1.5">
                Mandatory Business Justification
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Incident #INC-901 database migration hotfix approved in Sprint 42"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-white border border-[#d0d5dd] rounded-xl p-3 text-[13px] text-[#101828] focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#eff6ff] shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Elevation Ticket...' : 'Submit Break-Glass Request'}</span>
            </button>
          </form>
        </div>

        {/* Right: Active Elevation Tickets Queue */}
        <div className="lg:col-span-7 card-modern p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eaecf0]">
            <h3 className="font-bold text-[14px] text-[#101828] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Live JIT Tickets & Approval Queue</span>
            </h3>
            <span className="text-[11px] font-mono text-[#667085]">
              Approver: <strong>Diana Prince (SecAdmin)</strong>
            </span>
          </div>

          <div className="space-y-3">
            {jitRequests.length === 0 ? (
              <div className="text-center py-10 text-[#667085]">
                <Clock className="w-8 h-8 text-[#98a2b3] mx-auto mb-2" />
                <p className="text-[13px]">No active JIT elevation tickets found.</p>
              </div>
            ) : (
              jitRequests.map((req) => {
                const user = users.find(u => u.username === req.username);
                const resource = resources.find(r => r.id === req.resource_id);

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-[#eaecf0] bg-white hover:border-[#d0d5dd] transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[13px] text-[#101828]">
                            {user?.full_name || req.username}
                          </span>
                          <span className="text-[11px] text-[#667085] font-mono">({req.id})</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                            req.status === 'APPROVED' ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]' :
                            req.status === 'PENDING' ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a] animate-pulse' :
                            'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="text-[12px] text-[#475467] mt-1 font-medium">
                          Target: <strong className="text-[#101828]">{resource?.name || req.resource_id}</strong> ({req.requested_duration_minutes} min window)
                        </div>

                        <p className="text-[12px] text-[#667085] mt-1 bg-[#fafbfc] p-2 rounded-lg border border-[#f2f4f7] italic">
                          "{req.business_justification}"
                        </p>
                      </div>

                      {/* Admin Decision Actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {req.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#fef2f2] hover:bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : req.status === 'APPROVED' && req.jit_token ? (
                          <button
                            onClick={() => copyToken(req.id, req.jit_token!)}
                            className="px-2.5 py-1 rounded-md bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 border border-[#bfdbfe]"
                          >
                            {copiedId === req.id ? (
                              <>
                                <Check className="w-3 h-3 text-[#10b981]" />
                                <span className="text-[#10b981]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Token</span>
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
