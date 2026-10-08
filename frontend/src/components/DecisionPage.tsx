import React, { useState } from 'react';
import type { PolicyDecision, User, DeviceStatus, Resource } from '../types';
import { api } from '../services/api';
import {
  ArrowLeft, CheckCircle2, XCircle, Key, Clock, Copy, Check,
  ChevronDown, ChevronUp, Terminal, RefreshCw, Shield, KeyRound,
  ExternalLink, ArrowRight, ShieldCheck, Lock
} from 'lucide-react';

interface DecisionPageProps {
  decision: PolicyDecision;
  user: User;
  device: DeviceStatus;
  resource: Resource;
  onBackToCatalog: () => void;
  onGoToRemainingPages?: (tabId: string) => void;
  onRequestJit: () => void;
  onPromptMfa: () => void;
}

export const DecisionPage: React.FC<DecisionPageProps> = ({
  decision, user, device, resource, onBackToCatalog, onGoToRemainingPages, onRequestJit, onPromptMfa
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [gatewayPayload, setGatewayPayload] = useState<any | null>(null);
  const [fetchingGateway, setFetchingGateway] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const isAllowed = decision.verdict === 'ALLOW';
  const isDeny = decision.verdict === 'DENY';
  const isMfa = decision.verdict === 'MFA_REQUIRED';
  const isJit = decision.verdict === 'JIT_REQUIRED';

  // Decode JWT Payload for live inspection
  const decodedToken = React.useMemo(() => {
    if (!decision.gateway_token) return null;
    try {
      const parts = decision.gateway_token.split('.');
      if (parts.length === 3) {
        return JSON.parse(atob(parts[1]));
      }
    } catch {
      return null;
    }
    return null;
  }, [decision.gateway_token]);

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
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      
      {/* Top Navigation & Step Indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] hover:text-[#101828] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Application Catalog</span>
        </button>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">
          Step 4 of 4: Verification & Token Issuance
        </span>
      </div>

      {/* 1. Primary Verdict Card */}
      <div className="bg-white rounded-2xl p-7 border border-[#eaecf0] shadow-xs text-center space-y-4">
        
        {/* Status Icon */}
        <div className="inline-flex items-center justify-center">
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

        {/* Verdict Heading & Rationale */}
        <div>
          <h2 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
            {isAllowed ? 'Access Granted — JWT Issued' :
             isDeny ? 'Access Denied — Policy Violation' :
             isMfa ? 'Step-Up MFA Challenge Required' : 'Just-In-Time Elevation Required'}
          </h2>
          <p className="text-[13px] text-[#667085] max-w-lg mx-auto mt-1.5 leading-normal">
            {decision.decision_reason}
          </p>
        </div>

        {/* Verification Summary Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#344054]">
            Subject: {user.username} ({user.role})
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#344054]">
            Resource: {resource.name} ({resource.sensitivity})
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#344054]">
            Risk: <strong className={decision.risk_score >= 50 ? 'text-[#b91c1c]' : 'text-[#047857]'}>{decision.risk_score}</strong>/100 ({decision.risk_level})
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#fafbfc] border border-[#eaecf0] text-[#667085]">
            Bound Device: {device.device_id}
          </span>
        </div>

        {/* Fallback actions if Denied / MFA / JIT */}
        <div className="max-w-sm mx-auto pt-2">
          {isDeny && (
            <button
              onClick={onBackToCatalog}
              className="w-full py-2.5 px-4 rounded-xl border border-[#d0d5dd] hover:bg-[#fafbfc] text-[#344054] font-medium text-[13px] transition cursor-pointer"
            >
              Return to Application Catalog
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
              Request 15-Minute JIT Elevation
            </button>
          )}
        </div>

      </div>

      {/* 2. Cryptographic JWT Token & User Access Hero Box (When ALLOWED) */}
      {isAllowed && decision.gateway_token && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#eaecf0] shadow-xs space-y-5">
          
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f4f7]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <KeyRound className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#101828]">
                  Cryptographic JWT Gateway Token (Device-Bound)
                </h3>
                <p className="text-[12px] text-[#667085]">
                  Short-lived signed bearer token authorized exclusively for this hardware endpoint.
                </p>
              </div>
            </div>

            <button
              onClick={copyToken}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d5dd] bg-white hover:bg-[#f9fafb] text-[12px] font-medium text-[#344054] transition cursor-pointer"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#047857]" />
                  <span className="text-[#047857]">Token Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#667085]" />
                  <span>Copy JWT</span>
                </>
              )}
            </button>
          </div>

          {/* Decoded Claims Grid */}
          {decodedToken && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[12px]">
              <div className="p-3 rounded-xl bg-[#fafbfc] border border-[#eaecf0]">
                <div className="text-[10px] uppercase font-semibold text-[#667085] tracking-wider mb-1">
                  Subject (User)
                </div>
                <div className="font-semibold text-[#101828] font-mono truncate">{decodedToken.sub}</div>
                <div className="text-[11px] text-[#667085]">{decodedToken.role}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#fafbfc] border border-[#eaecf0]">
                <div className="text-[10px] uppercase font-semibold text-[#667085] tracking-wider mb-1">
                  Audience (Resource)
                </div>
                <div className="font-semibold text-[#101828] font-mono truncate">{decodedToken.aud}</div>
                <div className="text-[11px] text-[#667085]">{resource.name}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#fafbfc] border border-[#eaecf0]">
                <div className="text-[10px] uppercase font-semibold text-[#667085] tracking-wider mb-1">
                  Hardware Binding
                </div>
                <div className="font-semibold text-[#101828] font-mono truncate">{decodedToken.device_id}</div>
                <div className="text-[11px] text-[#047857]">Bound to Endpoint</div>
              </div>

              <div className="p-3 rounded-xl bg-[#fafbfc] border border-[#eaecf0]">
                <div className="text-[10px] uppercase font-semibold text-[#667085] tracking-wider mb-1">
                  Algorithm & Validity
                </div>
                <div className="font-semibold text-[#101828] font-mono">HMAC-SHA256</div>
                <div className="text-[11px] text-[#667085]">15 min duration</div>
              </div>
            </div>
          )}

          {/* Raw Encoded Token Container */}
          <div>
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
              Signed Bearer Token Payload
            </div>
            <div className="p-3 rounded-xl bg-[#1e293b] text-white font-mono text-[11px] break-all border border-[#334155] max-h-24 overflow-y-auto leading-relaxed">
              <span className="text-[#f472b6]">{decision.gateway_token.split('.')[0]}</span>
              <span className="text-white/60">.</span>
              <span className="text-[#38bdf8]">{decision.gateway_token.split('.')[1]}</span>
              <span className="text-white/60">.</span>
              <span className="text-[#34d399]">{decision.gateway_token.split('.')[2]}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#98a2b3] mt-1 font-mono">
              <span><strong className="text-[#f472b6]">Header</strong> • <strong className="text-[#38bdf8]">Payload</strong> • <strong className="text-[#34d399]">Signature</strong></span>
              <span>Zero-Trust Microsegmentation Token</span>
            </div>
          </div>

          {/* Primary CTA: Launch & Access Protected Resource via PEP Gateway */}
          <div className="pt-2">
            <button
              onClick={handleConnectViaPep}
              disabled={fetchingGateway}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[13px] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {fetchingGateway ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to PEP Gateway & Decrypting Asset...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Access Protected Resource via PEP Gateway</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* Proxied Live Gateway Resource Payload */}
          {gatewayPayload && (
            <div className="mt-4 text-left bg-[#0f172a] text-white rounded-xl p-4 font-mono text-[11px] shadow-sm animate-in fade-in duration-200 border border-[#1e293b]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  <span className="text-[#38bdf8] font-bold">PEP GATEWAY PROXIED RESPONSE</span>
                </div>
                <span className="text-[#34d399] font-bold">HTTP 200 OK — AUTHORIZED</span>
              </div>
              <pre className="overflow-x-auto text-[#93c5fd] max-h-60">
                {JSON.stringify(gatewayPayload, null, 2)}
              </pre>
            </div>
          )}

        </div>
      )}

      {/* 3. Progressive Disclosure: Technical Policy Rule Verification Details */}
      <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4 flex items-center justify-between text-left text-[13px] font-medium text-[#344054] hover:bg-[#fafbfc] transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2563eb]" />
            <span>NIST SP 800-207 Policy Rule Verification Matrix ({decision.policy_checks.length} checks)</span>
          </div>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4 text-[#667085]" /> : <ChevronDown className="w-4 h-4 text-[#667085]" />}
        </button>

        {showTechnicalDetails && (
          <div className="p-4 pt-0 border-t border-[#f2f4f7] space-y-3">
            <div className="divide-y divide-[#f2f4f7] text-[12px]">
              {decision.policy_checks.map((c, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[#101828] font-medium">{c.rule_name}</div>
                    <div className="text-[11px] text-[#667085]">{c.message}</div>
                  </div>
                  <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    c.passed ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fef2f2] text-[#b91c1c]'
                  }`}>
                    {c.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#fafbfc] rounded-lg text-[11px] text-[#667085] font-mono border border-[#eaecf0] flex items-center justify-between">
              <span>Cryptographic PDP Audit Hash</span>
              <span className="text-[#2563eb] truncate max-w-xs">{decision.audit_hash}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Navigation to Remaining Pages */}
      <div className="bg-white rounded-xl p-4 border border-[#eaecf0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onBackToCatalog}
          className="text-[13px] font-medium text-[#2563eb] hover:underline cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Request Another Application</span>
        </button>

        {onGoToRemainingPages && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#667085]">Explore Remaining Pages:</span>
            <button
              onClick={() => onGoToRemainingPages('policies')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#f4f5f7] hover:bg-[#e5e7eb] text-[#344054] transition cursor-pointer"
            >
              Policies
            </button>
            <button
              onClick={() => onGoToRemainingPages('devices')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#f4f5f7] hover:bg-[#e5e7eb] text-[#344054] transition cursor-pointer"
            >
              Device Fleet
            </button>
            <button
              onClick={() => onGoToRemainingPages('audit')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#f4f5f7] hover:bg-[#e5e7eb] text-[#344054] transition cursor-pointer"
            >
              SIEM Audit
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
