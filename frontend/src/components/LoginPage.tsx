import React, { useState } from 'react';
import type { User, DeviceStatus } from '../types';
import { Lock, Shield, Laptop, ArrowRight, Check } from 'lucide-react';

interface LoginPageProps {
  users: User[];
  devices: DeviceStatus[];
  onLogin: (user: User, device: DeviceStatus) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, devices, onLogin }) => {
  const [selectedUsername, setSelectedUsername] = useState<string>('alice.finance');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('DEV-CORP-01');
  const [password, setPassword] = useState<string>('••••••••••••');

  const currentUser = users.find(u => u.username === selectedUsername) || users[0];
  const currentDevice = devices.find(d => d.device_id === selectedDeviceId) || devices[0];

  const handleSelectUser = (u: User) => {
    setSelectedUsername(u.username);
    if (u.assigned_devices && u.assigned_devices.length > 0) {
      setSelectedDeviceId(u.assigned_devices[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && currentDevice) {
      onLogin(currentUser, currentDevice);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-14">
      {/* Step 1 Indicator */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563eb] text-white shadow-xs mb-3">
          <Lock className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] mb-1">
          Step 1 of 3: Authentication
        </div>
        <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
          Zero-Trust Gateway Login
        </h1>
        <p className="text-[13px] text-[#667085] mt-1 max-w-sm mx-auto">
          Authenticate subject identity and bind client hardware endpoint.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#eaecf0] shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Persona Selection */}
          <div>
            <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block mb-2">
              Select Enterprise Identity
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = selectedUsername === u.username;
                return (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#f8faff] border-[#2563eb] shadow-xs'
                        : 'bg-white border-[#eaecf0] hover:border-[#d0d5dd] hover:bg-[#fafbfc]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-[13px] font-semibold text-[#101828] truncate">
                        {u.full_name}
                      </div>
                      <div className="text-[11px] text-[#667085] font-mono">
                        {u.role.replace('_OFFICER', '').replace('_ENGINEER', '')}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#2563eb] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bound Hardware Endpoint */}
          <div>
            <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block mb-1.5">
              Assigned Client Hardware Endpoint
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-[#d0d5dd] bg-white text-[#101828] outline-none focus:border-[#2563eb] cursor-pointer"
            >
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.name} ({d.trust_level.replace('_CORPORATE', '')})
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block mb-1.5">
              Corporate Password (Argon2id)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[13px] font-mono px-3.5 py-2.5 rounded-xl border border-[#d0d5dd] bg-white text-[#101828] outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
            >
              <span>Authenticate & Enter Application Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>

      {/* Security Footnote */}
      <div className="text-center mt-6 text-[11px] text-[#98a2b3] flex items-center justify-center gap-4">
        <span>TLS 1.3 Strict</span>
        <span>•</span>
        <span>Device-Bound JWT</span>
        <span>•</span>
        <span>NIST SP 800-207</span>
      </div>
    </div>
  );
};
