import React from 'react';
import {
  ShieldCheck, Lock, UserCheck, Smartphone, Clock, AlertTriangle,
  FileText, Server, Cpu, Database, CheckCircle2, ArrowRight
} from 'lucide-react';

export const ArchitectureExplainerTab: React.FC = () => {
  const challenges = [
    {
      title: '1. Authentication',
      icon: UserCheck,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      description: 'Verifies subject authenticity before evaluation.',
      implementation: 'Multi-factor authentication (TOTP) step-up challenges invoked dynamically for high-sensitivity resources or when anomalous environmental risk is detected.'
    },
    {
      title: '2. Authorization',
      icon: Lock,
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      description: 'Determines what actions the subject is permitted to perform.',
      implementation: 'Combines Role-Based (RBAC) and Attribute-Based Access Control (ABAC) against a fine-grained enterprise clearance matrix (LOW, MEDIUM, HIGH, CRITICAL).'
    },
    {
      title: '3. Least Privilege',
      icon: ShieldCheck,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      description: 'Limits access rights to only what is strictly required.',
      implementation: 'Default-deny architecture. Enforces Zero Standing Privileges (ZSP) where critical operations require time-bounded (15m) Just-In-Time (JIT) elevation with auditable business justification.'
    },
    {
      title: '4. Policy Enforcement',
      icon: Cpu,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Guarantees access decisions are uniformly and reliably executed.',
      implementation: 'NIST SP 800-207 decoupled architecture: Policy Decision Point (PDP) evaluates environmental context and rules; Policy Enforcement Point (PEP) acts as ingress gateway gatekeeper.'
    },
    {
      title: '5. Privilege Escalation',
      icon: AlertTriangle,
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      description: 'Prevents adversaries from gaining unauthorized elevated rights.',
      implementation: 'Cryptographically signed JWT tokens with device-binding (tokens bound to device_id cannot be replayed on rogue hardware) and tamper-evident HMAC signatures.'
    },
    {
      title: '6. Trust Boundaries',
      icon: Server,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      description: 'Enforces network segmentation and eliminates implicit perimeter trust.',
      implementation: 'Microsegmentation architecture: internal enterprise resources (Banking, K8s, HR) reside in isolated backend perimeters accessible only via authenticated PEP reverse proxy.'
    },
    {
      title: '7. Access Logging',
      icon: Database,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      description: 'Provides forensic visibility, auditable telemetry, and SIEM monitoring.',
      implementation: 'Blockchain-style cryptographic hash chaining (SHA-256 prev_hash linking) guaranteeing tamper-evidence. Complete SIEM dashboard with threat analytics and attack lab.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-slate-50 border border-blue-200 rounded-2xl p-6 shadow-xs">
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest block mb-2">
            Project Specification & Design Brief
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            24. Zero-Trust Enterprise Access Portal
          </h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            A comprehensive, simplified Zero Trust access platform implementing the <strong>NIST SP 800-207</strong> standard. 
            When users request access to internal applications, the platform evaluates all 6 continuous signals:
            <span className="text-blue-700 font-semibold"> (1) User Identity, (2) Role, (3) Device Status, (4) Requested Resource, (5) Access Time, and (6) Dynamic Risk Level</span>, 
            directly resolving each of the 7 core security challenges.
          </p>
        </div>
      </div>

      {/* NIST SP 800-207 Architecture Diagram */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" />
          NIST SP 800-207 Zero Trust Logical Architecture
        </h3>

        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            
            {/* Subject Node */}
            <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-xs text-left">
              <span className="text-[10px] font-mono font-bold text-blue-700 uppercase block mb-1">Untrusted Zone</span>
              <h4 className="font-bold text-sm text-gray-900">Subject (User & Device)</h4>
              <ul className="text-[11px] text-gray-600 mt-2 space-y-1">
                <li>• Alice / Bob / Charlie / Diana / Eve</li>
                <li>• Corporate Laptop vs BYOD Phone</li>
                <li>• EDR, Firewall & Posture State</li>
                <li>• Context: IP, Time of Day</li>
              </ul>
            </div>

            {/* PEP Gatekeeper */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-400 shadow-xs text-left relative flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-800 uppercase block mb-1">Data Plane Gatekeeper</span>
                <h4 className="font-bold text-sm text-gray-900">Policy Enforcement Point (PEP)</h4>
                <p className="text-[11px] text-gray-700 mt-2">
                  Intercepts all resource ingress traffic. Verifies device-bound gateway token before proxying.
                </p>
              </div>
              <div className="text-[10px] font-mono text-blue-700 pt-2 border-t border-blue-200 font-semibold">
                /api/gateway/access/:id
              </div>
            </div>

            {/* Enterprise Resources */}
            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs text-left">
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase block mb-1">Implicit Trust Zone Destroyed</span>
              <h4 className="font-bold text-sm text-gray-900">Protected Enterprise Apps</h4>
              <ul className="text-[11px] text-gray-600 mt-2 space-y-1">
                <li>• Core Banking Ledger (Critical)</li>
                <li>• Prod Kubernetes Cluster (Critical)</li>
                <li>• HR & Compensation Records (High)</li>
                <li>• Git Source Code & Internal Wiki</li>
              </ul>
            </div>
          </div>

          {/* Control Plane (PDP) */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-purple-50 via-blue-50 to-slate-50 border border-purple-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-700 uppercase block">Control Plane</span>
                <h4 className="font-bold text-base text-gray-900">Policy Decision Point (PDP)</h4>
              </div>
              <span className="text-xs font-mono text-gray-500 font-medium">/api/access/request</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
                <strong className="text-blue-700 block mb-0.5">Policy Rules Matrix</strong>
                <span className="text-gray-600 text-[11px]">Evaluates ABAC/RBAC clearance against resource sensitivity.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
                <strong className="text-cyan-700 block mb-0.5">Continuous Risk Engine</strong>
                <span className="text-gray-600 text-[11px]">Computes multi-factor risk score (0-100) dynamically.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
                <strong className="text-purple-700 block mb-0.5">JIT Elevation Engine</strong>
                <span className="text-gray-600 text-[11px]">Manages short-lived emergency access tickets and expirations.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
                <strong className="text-rose-700 block mb-0.5">Cryptographic SIEM</strong>
                <span className="text-gray-600 text-[11px]">Chains SHA-256 tamper-evident logs for every decision.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Security Challenges Detailed Cards */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          How The 7 Security Challenges Are Solved
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((chal, i) => {
            const Icon = chal.icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`p-2 rounded-lg border ${chal.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{chal.title}</h4>
                      <p className="text-[11px] text-gray-500">{chal.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mt-3 bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                    <strong className="text-blue-700 block mb-1">Architecture Solution:</strong>
                    {chal.implementation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
