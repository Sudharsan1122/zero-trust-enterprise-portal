import React from 'react';
import { Lock, Shield, Laptop, Sliders, Database, RefreshCw, CheckCircle2, LogOut } from 'lucide-react';
import type { SiemMetrics, User } from '../types';

interface HeaderProps {
  metrics: SiemMetrics | null;
  onReset: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  hasDecision: boolean;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics, onReset, activeTab, setActiveTab, currentUser, hasDecision, isAuthenticated, onLogout
}) => {
  const threatLevel = metrics?.summary.threat_level || 'NORMAL';

  // 5 Clean Tabs (Available once authenticated)
  const tabs = [
    { id: 'access', label: '1. Access', icon: Shield },
    ...(hasDecision ? [{ id: 'decision', label: '2. Decision', icon: CheckCircle2 }] : []),
    { id: 'devices', label: 'Devices', icon: Laptop },
    { id: 'policies', label: 'Policies', icon: Sliders },
    { id: 'audit', label: 'Audit', icon: Database },
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

            {/* Navigation Tabs (Only when Authenticated) */}
            {isAuthenticated && (
              <nav className="hidden sm:flex items-center gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition cursor-pointer ${
                        isActive
                          ? 'bg-[#f4f5f7] text-[#101828] font-semibold'
                          : 'text-[#667085] hover:text-[#101828] hover:bg-[#fafbfc]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2563eb]' : 'text-[#667085]'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
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
                <span className="hidden md:inline text-[13px] font-medium text-[#101828]">
                  {currentUser.full_name.split(' ')[0]}
                </span>
                <button
                  onClick={onLogout}
                  title="Log out and switch identity"
                  className="p-1.5 text-[#667085] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-md transition cursor-pointer"
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

        {/* Mobile Tab Strip (When Authenticated) */}
        {isAuthenticated && (
          <nav className="sm:hidden flex items-center gap-1 border-t border-[#eaecf0] py-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-md whitespace-nowrap ${
                    isActive
                      ? 'bg-[#f4f5f7] text-[#101828] font-semibold'
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
