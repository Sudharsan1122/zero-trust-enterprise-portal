import React, { useState } from 'react';
import type { PolicyDecision, User, DeviceStatus, Resource } from '../types';
import { api } from '../services/api';
import {
  ArrowLeft, CheckCircle2, XCircle, Key, Clock, Copy, Check,
  ChevronDown, ChevronUp, Terminal, RefreshCw, Shield
} from 'lucide-react';

interface DecisionPageProps {
  decision: PolicyDecision;
  user: User;
  device: DeviceStatus;
  resource: Resource;
  onBack: () => void;
  onRequestJit: () => void;
  onPromptMfa: () => void;
}

export const DecisionPage: React.FC<DecisionPageProps> = ({
  decision, user, device, resource, onBack, onRequestJit, onPromptMfa
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [gatewayPayload, setGatewayPayload] = useState<any | null>(null);
  const [fetchingGateway, setFetchingGateway] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const isAllowed = decision.verdict === 'ALLOW';
  const isDeny = decision.verdict === 'DENY';
  const isMfa = decision.verdict === 'MFA_REQUIRED';
  const isJit = decision.verdict === 'JIT_REQUIRED';

  const handleConnectViaPep = async () => {
    if (!decision.gateway_token) return;
    setFetchingGateway(true);
    try {
      const data = await api.fetchGatewayResource(
        decision.resource_id,
        decision.gateway_token,
        decision.device_id
      );
      setGatewayPayload(data);
    } catch (err: any) {
      alert(err.message || 'Error connecting to gateway');
    } finally {
      setFetchingGateway(false);
    }
  };

  const copyToken = () => {
    if (decision.gateway_token) {
      navigator.clipboard.writeText(decision.gateway_token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      
      {/* Top Navigation & Step Indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] hover:text-[#101828] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Application Catalog</span>
        </button>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">
          Step 3 of 3: Policy Decision
        </span>
      </div>

      {/* Primary Verdict Card (Minimal, High-Impact) */}
      <div className="bg-white rounded-2xl p-7 border border-[#eaecf0] shadow-[0_1px_3px_rgba(16,24,40,0.06)] text-center">
        
        {/* Status Icon */}
        <div className="inline-flex items-center justify-center mb-4">
          {isAllowed && (
            <div className="w-14 h-14 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>
          )}
          {isDeny && (
            <div className="w-14 h-14 rounded-full bg-[#fef2f2] text-[#ef4444] flex items-center justify-center">
              <XCircle className="w-8 h-8 stroke-[2.2]" />
            </div>
          )}
          {isMfa && (
            <div className="w-14 h-14 rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center">
              <Key className="w-8 h-8 stroke-[2.2]" />
            </div>
          )}
          {isJit && (
            <div className="w-14 h-14 rounded-full bg-[#faf5ff] text-[#8b5cf6] flex items-center justify-center">
              <Clock className="w-8 h-8 stroke-[2.2]" />
            </div>
          )}
        </div>

        {/* Big Verdict Heading */}
        <h2 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
          {isAllowed ? 'Access Granted' :
           isDeny ? 'Access Denied' :
           isMfa ? 'Verification Required' : 'Elevation Required'}
        </h2>

        {/* 1-Sentence Reason */}
        <p className="text-[13px] text-[#667085] max-w-md mx-auto mt-1.5 leading-normal">
          {decision.decision_reason}
        </p>

        {/* Meta summary pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#344054]">
            {resource.name}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#344054]">
            Risk: <strong className={decision.risk_score >= 50 ? 'text-[#b91c1c]' : 'text-[#047857]'}>{decision.risk_score}</strong>/100 ({decision.risk_level})
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#667085]">
            {device.name}
          </span>
        </div>

        {/* Primary Action Button */}
        <div className="mt-6 max-w-sm mx-auto">
          {isAllowed && decision.gateway_token && (
            <button
              onClick={handleConnectViaPep}
              disabled={fetchingGateway}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[13px] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {fetchingGateway ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Launch Application via PEP Gateway</span>
                </>
              )}
            </button>
          )}

          {isMfa && (
            <button
              onClick={onPromptMfa}
              className="w-full py-2.5 px-4 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium text-[13px] transition cursor-pointer shadow-xs"
            >
              Complete Step-Up Verification
            </button>
          )}

          {isJit && (
            <button
              onClick={onRequestJit}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium text-[13px] transition cursor-pointer shadow-xs"
            >
              Request 15-Minute Elevation
            </button>
          )}

          {isDeny && (
            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 rounded-xl border border-[#d0d5dd] hover:bg-[#fafbfc] text-[#344054] font-medium text-[13px] transition cursor-pointer"
            >
              Return to Catalog
            </button>
          )}
        </div>

        {/* Proxied Payload (Revealed on Action) */}
        {gatewayPayload && (
          <div className="mt-6 text-left bg-[#101828] text-white rounded-xl p-4 font-mono text-[11px] shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-[#67e8f9]">
              <span>PEP GATEWAY PROXIED RESPONSE</span>
              <span className="text-[#98a2b3]">HTTP 200 OK</span>
            </div>
            <pre className="overflow-x-auto text-[#93c5fd]">
              {JSON.stringify(gatewayPayload, null, 2)}
            </pre>
          </div>
        )}

      </div>

      {/* Progressive Disclosure: Collapsible Technical Verification Details */}
      <div className="bg-white rounded-xl border border-[#eaecf0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-4 flex items-center justify-between text-left text-[13px] font-medium text-[#344054] hover:bg-[#fafbfc] transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2563eb]" />
            <span>Policy Evaluation Details ({decision.policy_checks.length} checks)</span>
          </div>
          {showDetails ? <ChevronUp className="w-4 h-4 text-[#667085]" /> : <ChevronDown className="w-4 h-4 text-[#667085]" />}
        </button>

        {showDetails && (
          <div className="p-4 pt-0 border-t border-[#f2f4f7] space-y-3">
            {/* Checks list */}
            <div className="divide-y divide-[#f2f4f7] text-[12px]">
              {decision.policy_checks.map((c, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <span className="text-[#344054]">{c.rule_name}</span>
                  <span className={`font-mono text-[11px] ${c.passed ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>
                    {c.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>

            {/* Token preview */}
            {decision.gateway_token && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-[#667085] mb-1">
                  <span>Device-Bound Gateway Token</span>
                  <button
                    onClick={copyToken}
                    className="text-[#2563eb] hover:underline cursor-pointer"
                  >
                    {copiedToken ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-2 bg-[#f8f9fa] rounded-lg font-mono text-[10px] text-[#475467] break-all border border-[#eaecf0]">
                  {decision.gateway_token.slice(0, 80)}...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
