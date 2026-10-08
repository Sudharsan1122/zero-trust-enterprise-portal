import React, { useState } from 'react';
import type { User, DeviceStatus, Resource, PolicyDecision } from '../types';
import { api } from '../services/api';
import { Shield, Key, Clock, ArrowRight, RefreshCw, Check } from 'lucide-react';

interface AccessPortalTabProps {
  users: User[];
  devices: DeviceStatus[];
  resources: Resource[];
  currentUser: User;
  currentDevice: DeviceStatus;
  onSelectUser: (user: User, device: DeviceStatus) => void;
  onSwitchUser?: () => void;
  onDecisionGenerated: (decision: PolicyDecision, resource: Resource) => void;
}

export const AccessPortalTab: React.FC<AccessPortalTabProps> = ({
  users, devices, resources, currentUser, currentDevice, onSelectUser, onSwitchUser, onDecisionGenerated
}) => {
  const [isAfterHours, setIsAfterHours] = useState<boolean>(false);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [showMfaModal, setShowMfaModal] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [pendingResource, setPendingResource] = useState<Resource | null>(null);

  const handleUserClick = (u: User) => {
    const assignedDev = devices.find(d => u.assigned_devices?.includes(d.device_id)) || devices[0];
    onSelectUser(u, assignedDev);
  };

  const handleRequestAccess = async (resource: Resource, customMfa?: string) => {
    setEvaluatingId(resource.id);
    const timeString = isAfterHours ? '23:30' : '10:30';

    try {
      const result = await api.requestAccess({
        username: currentUser.username,
        device_id: currentDevice.device_id,
        resource_id: resource.id,
        current_time: timeString,
        client_ip: currentDevice.ip_address,
        location: currentDevice.location,
        mfa_code: customMfa !== undefined ? customMfa : mfaCode,
      });

      if (result.verdict === 'MFA_REQUIRED') {
        setPendingResource(resource);
        setShowMfaModal(true);
      } else {
        setShowMfaModal(false);
        setMfaCode('');
        onDecisionGenerated(result, resource);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error evaluating access request');
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleMfaSubmit = async () => {
    if (pendingResource) {
      setShowMfaModal(false);
      await handleRequestAccess(pendingResource, mfaCode);
    }
  };

  return (
    <div className="space-y-7">
      
      {/* Step 2 Indicator & Active Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] mb-1">
            Step 2 of 3: Resource Catalog
          </div>
          <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
            Enterprise Application Catalog
          </h1>
          <p className="text-[13px] text-[#667085] mt-1">
            Select an enterprise service to submit for real-time zero-trust policy evaluation.
          </p>
        </div>

        {/* Active Identity Pill with Switch Option */}
        <div className="flex items-center gap-3 p-2 px-3 rounded-xl bg-white border border-[#eaecf0] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] flex items-center justify-center font-bold text-[12px]">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="text-left text-[12px]">
            <div className="font-semibold text-[#101828] leading-tight">{currentUser.full_name}</div>
            <div className="text-[11px] text-[#667085] font-mono leading-tight">
              {currentUser.role} • {currentDevice.name}
            </div>
          </div>
          {onSwitchUser && (
            <button
              onClick={onSwitchUser}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#f4f5f7] hover:bg-[#e5e7eb] text-[#344054] transition cursor-pointer ml-1"
            >
              Switch User
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar: Simulation Controls (Progressive Disclosure) */}
      <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1 border-t border-[#eaecf0]">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#101828]">
            <input
              type="checkbox"
              checked={isAfterHours}
              onChange={(e) => setIsAfterHours(e.target.checked)}
              className="rounded text-[#2563eb] w-3.5 h-3.5"
            />
            <span>Simulate After-Hours (Off-Hours Penalty)</span>
          </label>
        </div>

        <span className="font-mono text-[#98a2b3]">
          Endpoint IP: {currentDevice.ip_address}
        </span>
      </div>

      {/* Application Catalog Grid (3-columns, 12px gap, 20px padding) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((res) => {
          const isEvaluating = evaluatingId === res.id;
          return (
            <div
              key={res.id}
              className="bg-white rounded-xl p-5 border border-[#eaecf0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] hover:border-[#d0d5dd] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Title + Sensitivity Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[15px] font-semibold text-[#101828] leading-tight">
                    {res.name}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    res.sensitivity === 'CRITICAL' ? 'bg-[#fef2f2] text-[#b91c1c]' :
                    res.sensitivity === 'HIGH' ? 'bg-[#fff7ed] text-[#c2410c]' :
                    res.sensitivity === 'MEDIUM' ? 'bg-[#fffbeb] text-[#b45309]' :
                    'bg-[#ecfdf5] text-[#047857]'
                  }`}>
                    {res.sensitivity}
                  </span>
                </div>

                {/* Description (Concise 2 lines) */}
                <p className="text-[13px] text-[#667085] line-clamp-2 mb-3 leading-normal">
                  {res.description}
                </p>

                {/* Metadata Caption */}
                <div className="text-[11px] text-[#98a2b3] mb-4 flex items-center justify-between">
                  <span>Roles: {res.allowed_roles.slice(0, 2).join(', ')}</span>
                  <span>Max Risk: &le;{res.max_risk_tolerance}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => handleRequestAccess(res)}
                disabled={isEvaluating}
                className="w-full py-2 px-3.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Request Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Step-Up MFA Modal (Minimal Auth0 Style) */}
      {showMfaModal && pendingResource && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-[#eaecf0]">
            <h3 className="text-[15px] font-semibold text-[#101828]">Step-Up Verification</h3>
            <p className="text-[13px] text-[#667085] mt-1 mb-4">
              Enter 6-digit TOTP code for <strong className="text-[#101828]">{pendingResource.name}</strong>.
            </p>

            <input
              type="text"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-2.5 px-3 rounded-lg border border-[#d0d5dd] focus:border-[#2563eb] outline-none text-[#101828]"
            />

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setMfaCode('123456')}
                className="text-[11px] text-[#2563eb] hover:underline font-medium cursor-pointer"
              >
                Fill demo 123456
              </button>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowMfaModal(false)}
                className="flex-1 py-2 rounded-lg border border-[#d0d5dd] text-[13px] font-medium text-[#344054] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMfaSubmit}
                className="flex-1 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-medium"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
