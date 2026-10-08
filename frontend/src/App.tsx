import React, { useState, useEffect } from 'react';
import type { User, DeviceStatus, Resource, PolicyRule, JITRequest, SiemMetrics, PolicyDecision } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { AccessPortalTab } from './components/AccessPortalTab';
import { DecisionPage } from './components/DecisionPage';
import { DevicePostureTab } from './components/DevicePostureTab';
import { PolicyStudioTab } from './components/PolicyStudioTab';
import { SiemDashboardTab } from './components/SiemDashboardTab';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('access');
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [metrics, setMetrics] = useState<SiemMetrics | null>(null);

  // Active Subject Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentDevice, setCurrentDevice] = useState<DeviceStatus | null>(null);

  // Most Recent Decision Result
  const [latestDecision, setLatestDecision] = useState<PolicyDecision | null>(null);
  const [latestResource, setLatestResource] = useState<Resource | null>(null);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [u, d, r, p, m] = await Promise.all([
        api.getUsers(),
        api.getDevices(),
        api.getResources(),
        api.getPolicies(),
        api.getSiemMetrics(),
      ]);
      setUsers(u);
      setDevices(d);
      setResources(r);
      setPolicies(p);
      setMetrics(m);

      if (!currentUser && u.length > 0) {
        const defaultUser = u.find(user => user.username === 'alice.finance') || u[0];
        setCurrentUser(defaultUser);
        const defaultDev = d.find(dev => dev.device_id === 'DEV-CORP-01') || d[0];
        setCurrentDevice(defaultDev);
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to connect to Zero Trust backend service. Ensure backend is running.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api.getSiemMetrics().then(setMetrics).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: User, device: DeviceStatus) => {
    setCurrentUser(user);
    setCurrentDevice(device);
    setIsAuthenticated(true);
    setActiveTab('access');
    window.location.hash = '#/access';
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLatestDecision(null);
    setLatestResource(null);
    setActiveTab('login');
    window.location.hash = '';
  };

  // Sync hash in URL with active tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['access', 'decision', 'devices', 'policies', 'audit'].includes(hash)) {
        if (isAuthenticated) {
          setActiveTab(hash);
        }
      }
    };

    if (window.location.hash && isAuthenticated) {
      handleHashChange();
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = `#/${tabId}`;
  };

  const handleResetSystem = async () => {
    if (confirm('Reset Zero Trust portal to initial baseline seed state?')) {
      try {
        await api.resetSystem();
        await loadData();
        setLatestDecision(null);
        setLatestResource(null);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center text-[#475467] space-y-3">
        <RefreshCw className="w-6 h-6 text-[#2563eb] animate-spin" />
        <p className="text-[13px] font-medium text-[#101828]">Loading Zero-Trust Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#101828] flex flex-col font-sans">
      
      {/* 1. Simplified Minimal Header (56px) */}
      <Header
        metrics={metrics}
        onReset={handleResetSystem}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        hasDecision={latestDecision !== null}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-[12px] flex items-center gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Authentication Screen (Shown first) */}
        {!isAuthenticated ? (
          <LoginPage
            users={users}
            devices={devices}
            onLogin={handleLogin}
          />
        ) : (
          <>
            {/* Step 2: Access Catalog */}
            {activeTab === 'access' && currentUser && currentDevice && (
              <AccessPortalTab
                users={users}
                devices={devices}
                resources={resources}
                currentUser={currentUser}
                currentDevice={currentDevice}
                onSelectUser={(u, d) => {
                  setCurrentUser(u);
                  setCurrentDevice(d);
                }}
                onSwitchUser={handleLogout}
                onDecisionGenerated={(dec, res) => {
                  setLatestDecision(dec);
                  setLatestResource(res);
                  handleTabChange('decision');
                }}
              />
            )}

            {/* Step 3: Decision (Progressive Disclosure Result View) */}
            {activeTab === 'decision' && latestDecision && latestResource && currentUser && currentDevice && (
              <DecisionPage
                decision={latestDecision}
                user={currentUser}
                device={currentDevice}
                resource={latestResource}
                onBack={() => handleTabChange('access')}
                onRequestJit={() => handleTabChange('access')}
                onPromptMfa={() => handleTabChange('access')}
              />
            )}

            {/* TAB 3: Devices (Fleet Health & Toggles) */}
            {activeTab === 'devices' && (
              <DevicePostureTab
                devices={devices}
                onRefresh={loadData}
              />
            )}

            {/* TAB 4: Policies (Authorization Matrix) */}
            {activeTab === 'policies' && (
              <PolicyStudioTab
                policies={policies}
                resources={resources}
                onRefresh={loadData}
              />
            )}

            {/* TAB 5: Audit (SIEM & Logs) */}
            {activeTab === 'audit' && (
              <SiemDashboardTab
                metrics={metrics}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#eaecf0] bg-white py-3.5 mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] text-[#98a2b3]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#475467]">Zero-Trust Enterprise Portal</span>
            <span>•</span>
            <span className="font-mono text-[#2563eb]">NIST SP 800-207</span>
          </div>
          <div>SSE Project 24</div>
        </div>
      </footer>

    </div>
  );
}
