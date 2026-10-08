import React, { useState, useEffect } from 'react';
import type { SiemMetrics, AuditLogEntry } from '../types';
import { api } from '../services/api';
import { CheckCircle2, AlertTriangle, Hash, Copy, Check, Zap } from 'lucide-react';

interface SiemDashboardTabProps {
  metrics: SiemMetrics | null;
  onRefresh: () => void;
}

export const SiemDashboardTab: React.FC<SiemDashboardTabProps> = ({ metrics, onRefresh }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [selectedVerdict, setSelectedVerdict] = useState<string>('');
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [chainResult, setChainResult] = useState<{ valid: boolean; status: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await api.getSiemLogs({
        verdict: selectedVerdict || undefined,
      });
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedVerdict]);

  const handleVerifyIntegrity = async () => {
    setVerifyingChain(true);
    try {
      const res = await api.verifyAuditIntegrity();
      setChainResult(res);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleSimulateAttack = async (type: string) => {
    try {
      await api.simulateAttack(type);
      onRefresh();
      fetchLogs();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const summary = metrics?.summary;

  return (
    <div className="space-y-6">
      
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
            Security Audit Trail
          </h1>
          <p className="text-[13px] text-[#667085] mt-1">
            Cryptographically linked access records (SHA-256 hash chaining).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Attack Simulator Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleSimulateAttack(e.target.value);
                e.target.value = '';
              }
            }}
            className="text-[12px] bg-white border border-[#d0d5dd] rounded-lg px-2.5 py-1.5 text-[#344054] outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>⚡ Inject Test Threat...</option>
            <option value="brute_force">Credential Stuffing</option>
            <option value="tor_ingress">Tor Exit Ingress</option>
            <option value="privilege_escalation">Privilege Escalation</option>
            <option value="session_hijack">Token Replay</option>
            <option value="tamper_log">Mutate Audit Log</option>
          </select>

          {/* Verify Hash Chain */}
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifyingChain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] text-[12px] font-medium transition cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{verifyingChain ? 'Verifying...' : 'Verify Chain'}</span>
          </button>
        </div>
      </div>

      {/* 4 Minimal Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-[#eaecf0] shadow-xs">
          <span className="text-[11px] text-[#667085] uppercase tracking-wider block mb-1">Total Evaluated</span>
          <span className="text-xl font-bold font-mono text-[#101828]">{summary?.total_evaluations || 0}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#eaecf0] shadow-xs">
          <span className="text-[11px] text-[#047857] uppercase tracking-wider block mb-1 font-semibold">Allowed</span>
          <span className="text-xl font-bold font-mono text-[#047857]">{summary?.allowed_count || 0}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#eaecf0] shadow-xs">
          <span className="text-[11px] text-[#b91c1c] uppercase tracking-wider block mb-1 font-semibold">Denied / Blocked</span>
          <span className="text-xl font-bold font-mono text-[#b91c1c]">{summary?.denied_count || 0}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#eaecf0] shadow-xs">
          <span className="text-[11px] text-[#667085] uppercase tracking-wider block mb-1">Average Risk</span>
          <span className="text-xl font-bold font-mono text-[#2563eb]">{summary?.average_risk_score || 0}</span>
        </div>
      </div>

      {/* Verification Result Banner */}
      {chainResult && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-[12px] ${
          chainResult.valid
            ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]'
            : 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]'
        }`}>
          <div className="flex items-center gap-2.5">
            {chainResult.valid ? <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> : <AlertTriangle className="w-4 h-4 text-[#ef4444]" />}
            <span>{chainResult.status}</span>
          </div>
          <button
            onClick={() => setChainResult(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filterable Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#eaecf0] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#101828]">Audit Trail Blocks</span>
          <select
            value={selectedVerdict}
            onChange={(e) => setSelectedVerdict(e.target.value)}
            className="text-[12px] bg-white border border-[#d0d5dd] rounded-lg px-2.5 py-1 text-[#344054] outline-none"
          >
            <option value="">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="DENY">DENY</option>
            <option value="MFA_REQUIRED">MFA_REQUIRED</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#eaecf0] text-[11px] font-semibold text-[#667085] uppercase tracking-wider bg-[#fafbfc]">
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Verdict</th>
                <th className="py-2.5 px-4">Risk</th>
                <th className="py-2.5 px-4">Current Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaecf0] font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#fafbfc] transition">
                  <td className="py-3 px-4 font-sans font-medium text-[#101828]">
                    {log.username.split('.')[0]}
                  </td>
                  <td className="py-3 px-4 text-[#475467] font-sans">
                    {log.resource_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      log.verdict === 'ALLOW' ? 'bg-[#ecfdf5] text-[#047857]' :
                      log.verdict === 'MFA_REQUIRED' ? 'bg-[#fffbeb] text-[#b45309]' :
                      'bg-[#fef2f2] text-[#b91c1c]'
                    }`}>
                      {log.verdict}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#101828]">
                    {log.risk_score}
                  </td>
                  <td className="py-3 px-4 text-[#2563eb]">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[140px]">{log.current_hash}</span>
                      <button
                        onClick={() => copyHash(log.current_hash)}
                        className="text-[#98a2b3] hover:text-[#2563eb] cursor-pointer"
                      >
                        {copiedHash === log.current_hash ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
