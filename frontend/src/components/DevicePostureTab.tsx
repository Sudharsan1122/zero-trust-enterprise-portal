import React, { useState } from 'react';
import type { DeviceStatus } from '../types';
import { api } from '../services/api';
import { Laptop, Smartphone, Check, X, Shield, AlertTriangle } from 'lucide-react';

interface DevicePostureTabProps {
  devices: DeviceStatus[];
  onRefresh: () => void;
}

export const DevicePostureTab: React.FC<DevicePostureTabProps> = ({ devices, onRefresh }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (device: DeviceStatus, field: keyof DeviceStatus) => {
    setUpdatingId(device.device_id);
    const currentValue = device[field];
    try {
      await api.updateDevice(device.device_id, {
        [field]: !currentValue,
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getScore = (d: DeviceStatus) => {
    if (d.jailbroken_or_rooted) return 0;
    let score = 100;
    if (!d.is_antivirus_active) score -= 25;
    if (!d.is_firewall_enabled) score -= 20;
    if (!d.is_disk_encrypted) score -= 20;
    if (!d.has_client_cert) score -= 15;
    if (!d.is_corporate_managed) score -= 15;
    if (d.location.toLowerCase().includes('tor')) score -= 50;
    return Math.max(0, Math.min(100, score));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
          Endpoint Fleet Posture
        </h1>
        <p className="text-[13px] text-[#667085] mt-1">
          Real-time endpoint health verified by Policy Enforcement Point prior to granting microsegmentation.
        </p>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {devices.map((device) => {
          const score = getScore(device);
          const isCompromised = device.jailbroken_or_rooted || device.trust_level === 'COMPROMISED';

          return (
            <div
              key={device.device_id}
              className={`bg-white rounded-xl p-5 border transition-all ${
                isCompromised
                  ? 'border-[#fecaca] bg-[#fffbfa]'
                  : 'border-[#eaecf0] hover:border-[#d0d5dd]'
              } shadow-[0_1px_2px_rgba(16,24,40,0.04)]`}
            >
              {/* Header: Device Name & Health Score */}
              <div className="flex items-start justify-between pb-3.5 border-b border-[#eaecf0]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#f4f5f7] text-[#475467]">
                    {device.os_name.includes('iOS') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#101828] leading-tight">
                      {device.name}
                    </h3>
                    <div className="text-[11px] font-mono text-[#667085] mt-0.5">
                      {device.ip_address} • {device.os_name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[15px] font-bold font-mono ${
                    isCompromised ? 'text-[#b91c1c]' :
                    score >= 80 ? 'text-[#047857]' : 'text-[#b45309]'
                  }`}>
                    {score}
                  </span>
                  <span className="text-[10px] text-[#98a2b3] font-mono">/100</span>
                  <div className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-semibold mt-0.5 ${
                    device.trust_level === 'COMPLIANT_CORPORATE' ? 'bg-[#ecfdf5] text-[#047857]' :
                    device.trust_level === 'REGISTERED_BYOD' ? 'bg-[#eff6ff] text-[#1d4ed8]' :
                    'bg-[#fef2f2] text-[#b91c1c]'
                  }`}>
                    {device.trust_level.replace('_CORPORATE', '')}
                  </div>
                </div>
              </div>

              {/* Minimal Toggle Chips */}
              <div className="grid grid-cols-3 gap-2 mt-3.5">
                {[
                  { key: 'is_antivirus_active', label: 'EDR Antivirus', active: device.is_antivirus_active },
                  { key: 'is_disk_encrypted', label: 'BitLocker', active: device.is_disk_encrypted },
                  { key: 'is_firewall_enabled', label: 'Host Firewall', active: device.is_firewall_enabled },
                  { key: 'has_client_cert', label: 'Client Cert', active: device.has_client_cert },
                  { key: 'is_corporate_managed', label: 'Intune MDM', active: device.is_corporate_managed },
                  { key: 'jailbroken_or_rooted', label: 'Jailbreak', active: device.jailbroken_or_rooted, danger: true },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggle(device, item.key as keyof DeviceStatus)}
                    disabled={updatingId === device.device_id}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                      item.danger
                        ? item.active
                          ? 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c] font-semibold'
                          : 'bg-[#fafbfc] border-[#eaecf0] text-[#667085]'
                        : item.active
                        ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]'
                        : 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
