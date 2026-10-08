import React, { useState } from 'react';
import type { User, DeviceStatus } from '../types';
import { Laptop, ShieldCheck, ShieldAlert, Cpu, HardDrive, Shield, CheckCircle2, ArrowRight, ArrowLeft, KeyRound, Wifi } from 'lucide-react';

interface DeviceBindingPageProps {
  currentUser: User;
  devices: DeviceStatus[];
  mfaCode: string;
  onBindDevice: (device: DeviceStatus) => void;
  onBackToLogin: () => void;
}

export const DeviceBindingPage: React.FC<DeviceBindingPageProps> = ({
  currentUser,
  devices,
  mfaCode,
  onBindDevice,
  onBackToLogin,
}) => {
  // Default to the first assigned device for this user, or first device in fleet
  const defaultDeviceId = currentUser.assigned_devices && currentUser.assigned_devices.length > 0
    ? currentUser.assigned_devices[0]
    : devices[0]?.device_id || 'DEV-CORP-01';

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(defaultDeviceId);

  const selectedDevice = devices.find(d => d.device_id === selectedDeviceId) || devices[0];

  const handleProceed = () => {
    if (selectedDevice) {
      onBindDevice(selectedDevice);
    }
  };

  const isCorporate = selectedDevice?.is_corporate_managed;
  const isHealthy = selectedDevice?.is_disk_encrypted && selectedDevice?.is_antivirus_active && selectedDevice?.is_firewall_enabled;

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      
      {/* Top Breadcrumb & Step Indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] hover:text-[#101828] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">
          Step 2 of 4: Device Binding
        </span>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] mb-2 shadow-xs">
          <Laptop className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
          Endpoint Hardware Binding
        </h1>
        <p className="text-[13px] text-[#667085] max-w-md mx-auto">
          Continuous Zero-Trust evaluation requires cryptographically binding your authenticated identity to a validated physical endpoint.
        </p>
      </div>

      {/* Active User Session Pill */}
      <div className="bg-white rounded-xl p-3.5 border border-[#eaecf0] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-[13px]">
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#101828]">{currentUser.full_name}</div>
            <div className="text-[11px] text-[#667085] font-mono">
              {currentUser.role} • {currentUser.department}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>MFA Verified ({mfaCode || 'TOTP'})</span>
          </span>
          <button
            onClick={onBackToLogin}
            className="text-[11px] font-medium text-[#667085] hover:text-[#101828] px-2 py-1 hover:bg-[#f4f5f7] rounded-md transition cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      {/* Device Selection Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#eaecf0] shadow-xs space-y-5">
        <div>
          <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block mb-2">
            Select Physical Hardware Endpoint
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {devices.map((dev) => {
              const isSelected = dev.device_id === selectedDeviceId;
              const isAssigned = currentUser.assigned_devices?.includes(dev.device_id);
              return (
                <button
                  key={dev.device_id}
                  type="button"
                  onClick={() => setSelectedDeviceId(dev.device_id)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#f8faff] border-[#2563eb] shadow-xs ring-1 ring-[#2563eb]'
                      : 'bg-white border-[#eaecf0] hover:border-[#d0d5dd] hover:bg-[#fafbfc]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      dev.is_corporate_managed ? 'bg-[#eff6ff] text-[#2563eb]' : 'bg-[#fff7ed] text-[#ea580c]'
                    }`}>
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#101828] flex items-center gap-2">
                        <span>{dev.name}</span>
                        {isAssigned && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] font-semibold">
                            Assigned
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#667085] font-mono">
                        {dev.device_id} • {dev.os_name} {dev.os_version} • {dev.ip_address}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    dev.trust_level === 'COMPLIANT_CORPORATE' ? 'bg-[#ecfdf5] text-[#047857]' :
                    dev.trust_level === 'REGISTERED_BYOD' ? 'bg-[#fffbeb] text-[#b45309]' :
                    'bg-[#fef2f2] text-[#b91c1c]'
                  }`}>
                    {dev.trust_level.replace('COMPLIANT_', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Hardware Posture Inspection Box */}
        {selectedDevice && (
          <div className="pt-2 border-t border-[#f2f4f7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                Live Hardware Posture Verification
              </span>
              <span className={`text-[11px] font-semibold ${isHealthy ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>
                {isHealthy ? '✓ Compliant Endpoint' : '⚠ Non-Compliant Posture'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#fafbfc] border border-[#eaecf0] text-center">
                <HardDrive className={`w-4 h-4 mx-auto mb-1 ${selectedDevice.is_disk_encrypted ? 'text-[#047857]' : 'text-[#b91c1c]'}`} />
                <div className="text-[11px] font-medium text-[#101828]">Disk Encryption</div>
                <div className="text-[10px] text-[#667085] font-mono">
                  {selectedDevice.is_disk_encrypted ? 'AES-256 BitLocker' : 'Unencrypted'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fafbfc] border border-[#eaecf0] text-center">
                <Cpu className={`w-4 h-4 mx-auto mb-1 ${selectedDevice.has_client_cert ? 'text-[#047857]' : 'text-[#b91c1c]'}`} />
                <div className="text-[11px] font-medium text-[#101828]">TPM 2.0 / Cert</div>
                <div className="text-[10px] text-[#667085] font-mono">
                  {selectedDevice.has_client_cert ? 'mTLS Validated' : 'Missing Cert'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fafbfc] border border-[#eaecf0] text-center">
                <Shield className={`w-4 h-4 mx-auto mb-1 ${selectedDevice.is_antivirus_active ? 'text-[#047857]' : 'text-[#b91c1c]'}`} />
                <div className="text-[11px] font-medium text-[#101828]">EDR Agent</div>
                <div className="text-[10px] text-[#667085] font-mono">
                  {selectedDevice.is_antivirus_active ? 'Falcon Running' : 'Disabled'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fafbfc] border border-[#eaecf0] text-center">
                <Wifi className="w-4 h-4 mx-auto mb-1 text-[#2563eb]" />
                <div className="text-[11px] font-medium text-[#101828]">Network IP</div>
                <div className="text-[10px] text-[#667085] font-mono truncate">
                  {selectedDevice.ip_address}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
          >
            <span>Bind Hardware Endpoint & Proceed to Application Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Security Architecture Footnote */}
      <div className="text-center text-[11px] text-[#98a2b3] flex items-center justify-center gap-4">
        <span>Hardware Posture Verified</span>
        <span>•</span>
        <span>Device-Bound Security Context</span>
        <span>•</span>
        <span>NIST SP 800-207</span>
      </div>

    </div>
  );
};
