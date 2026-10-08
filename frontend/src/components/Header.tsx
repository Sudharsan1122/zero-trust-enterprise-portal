import React from 'react';
import { Lock, Shield, Laptop, Sliders, Database, RefreshCw, CheckCircle2, LogOut, KeyRound } from 'lucide-react';
import type { SiemMetrics, User, DeviceStatus } from '../types';

interface HeaderProps {
  metrics: SiemMetrics | null;
  onReset: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  currentDevice: DeviceStatus | null;
  hasDecision: boolean;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  onReset,
  activeTab,
  setActiveTab,
  currentUser,
  currentDevice,
  hasDecision,
  isAuthenticated,
  onLogout,
}) => {
  const threatLevel = metrics?.summary.threat_level || 'NORMAL';

  // Navigation items available once authenticated
  const sequentialTabs = [
    { id: 'device', label: '2. Device', icon: Laptop },
    { id: 'access', label: '3. Access', icon: Shield },
    ...(hasDecision ? [{ id: 'decision', label: '4. Token & Verify', icon: KeyRound }] : []),
  ];

  const managementTabs = [
    { id: 'policies', label: 'Policies', icon: Sliders },
    { id: 'devices', label: 'Fleet Health', icon: Laptop },
    { id: 'audit', label: 'SIEM Audit', icon: Database },
  ];

  return (
    <header className="border-b border-[#eaecf0] bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Brand + Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold shadow-xs">
                <Lock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-semibold text-[15px] text-[#101828] tracking-[-0.01em]">
                Zero-Trust Portal
              </span>
            </div>

            {/* Stepper & Management Tabs (Available when Authenticated) */}
            {isAuthenticated ? (
              <nav className="hidden lg:flex items-center gap-1 border-l border-[#eaecf0] pl-4">
                {/* Flow Stepper */}
                <div className="flex items-center gap-1">
                  {sequentialTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium rounded-md transition cursor-pointer ${
                          isActive
                            ? 'bg-[#eff6ff] text-[#2563eb] font-semibold border border-[#dbeafe]'
                            : 'text-[#475467] hover:text-[#101828] hover:bg-[#fafbfc]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="h-4 w-px bg-[#eaecf0] mx-1" />

                {/* Remaining Pages */}
                <div className="flex items-center gap-1">
                  {managementTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium rounded-md transition cursor-pointer ${
                          isActive
                            ? 'bg-[#f4f5f7] text-[#101828] font-semibold'
                            : 'text-[#667085] hover:text-[#101828] hover:bg-[#fafbfc]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#dbeafe] text-[#2563eb] text-[11px] font-semibold">
                Step 1 of 4: Authentication
              </span>
            )}
          </div>

          {/* Right: Status Pill + User Profile / Logout + Reset */}
          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f8f9fa] border border-[#eaecf0] text-[11px] font-medium text-[#475467]">
              <span className={`w-2 h-2 rounded-full ${
                threatLevel === 'CRITICAL' ? 'bg-[#ef4444]' :
                threatLevel === 'ELEVATED' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
              }`} />
              <span>{threatLevel === 'NORMAL' ? 'Online' : threatLevel}</span>
            </div>

            {/* Authenticated User & Logout */}
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2 pl-2">
                <div className="w-7 h-7 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] flex items-center justify-center font-semibold text-[11px]">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="hidden md:block text-left text-[12px] leading-tight">
                  <div className="font-medium text-[#101828]">{currentUser.full_name.split(' ')[0]}</div>
                  <div className="text-[10px] text-[#667085] font-mono">{currentDevice?.device_id || 'No Device'}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Log out and reset session"
                  className="p-1.5 text-[#667085] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-md transition cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            {/* Reset Icon */}
            <button
              onClick={onReset}
              title="Reset to seed data"
              className="p-1.5 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-[#f4f5f7] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Tab Strip (When Authenticated) */}
        {isAuthenticated && (
          <nav className="lg:hidden flex items-center gap-1 border-t border-[#eaecf0] py-1.5 overflow-x-auto no-scrollbar">
            {[...sequentialTabs, ...managementTabs].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap ${
                    isActive
                      ? 'bg-[#eff6ff] text-[#2563eb] font-semibold'
                      : 'text-[#667085]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
