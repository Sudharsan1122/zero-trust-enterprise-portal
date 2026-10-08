import React, { useState } from 'react';
import type { User, DeviceStatus, Resource, PolicyDecision } from '../types';
import { api } from '../services/api';
import { Shield, ArrowRight, RefreshCw, Laptop, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AccessPortalTabProps {
  currentUser: User;
  currentDevice: DeviceStatus;
  mfaCode: string;
  resources: Resource[];
  onChangeDevice?: () => void;
  onSwitchUser?: () => void;
  onDecisionGenerated: (decision: PolicyDecision, resource: Resource) => void;
}

export const AccessPortalTab: React.FC<AccessPortalTabProps> = ({
  currentUser,
  currentDevice,
  mfaCode,
  resources,
  onChangeDevice,
  onSwitchUser,
  onDecisionGenerated,
}) => {
  const [isAfterHours, setIsAfterHours] = useState<boolean>(false);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const handleRequestAccess = async (resource: Resource) => {
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
        mfa_code: mfaCode || '123456',
      });

      onDecisionGenerated(result, resource);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error evaluating access request');
    } finally {
      setEvaluatingId(null);
    }
  };

  return (
    <div className="space-y-7">
      
      {/* Top Breadcrumb & Step Indicator */}
      <div className="flex items-center justify-between">
        {onChangeDevice && (
          <button
            onClick={onChangeDevice}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] hover:text-[#101828] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Bound Device</span>
          </button>
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">
          Step 3 of 4: Request Access
        </span>
      </div>

      {/* Page Title & Active Session Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
            Enterprise Application Catalog
          </h1>
          <p className="text-[13px] text-[#667085] mt-1">
            Select an enterprise service to submit for real-time Zero-Trust PDP evaluation.
          </p>
        </div>

        {/* Bound Session Context Pill */}
        <div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-white border border-[#eaecf0] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] flex items-center justify-center font-bold text-[12px]">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="text-left text-[12px]">
            <div className="font-semibold text-[#101828] leading-tight flex items-center gap-1.5">
              <span>{currentUser.full_name}</span>
              <CheckCircle2 className="w-3 h-3 text-[#10b981]" title="MFA Verified" />
            </div>
            <div className="text-[11px] text-[#667085] font-mono leading-tight">
              {currentUser.role} • {currentDevice.name}
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            {onChangeDevice && (
              <button
                onClick={onChangeDevice}
                className="text-[11px] font-medium px-2 py-1 rounded-md bg-[#f4f5f7] hover:bg-[#e5e7eb] text-[#344054] transition cursor-pointer"
              >
                Device
              </button>
            )}
            {onSwitchUser && (
              <button
                onClick={onSwitchUser}
                className="text-[11px] font-medium px-2 py-1 rounded-md bg-[#f4f5f7] hover:bg-[#e5e7eb] text-[#344054] transition cursor-pointer"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar: Simulation Controls & Network Context */}
      <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1 border-t border-[#eaecf0]">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#101828]">
            <input
              type="checkbox"
              checked={isAfterHours}
              onChange={(e) => setIsAfterHours(e.target.checked)}
              className="rounded text-[#2563eb] w-3.5 h-3.5"
            />
            <span>Simulate After-Hours Access (23:30 PM Off-Hours Penalty)</span>
          </label>
        </div>

        <span className="font-mono text-[#98a2b3]">
          Endpoint IP: {currentDevice.ip_address} ({currentDevice.location})
        </span>
      </div>

      {/* Application Catalog Grid */}
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

                {/* Description */}
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
                className="w-full py-2.5 px-3.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating NIST SP 800-207 Rules...</span>
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

    </div>
  );
};
