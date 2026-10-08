import React, { useState, useEffect } from 'react';
import type { User, DeviceStatus, Resource, PolicyRule, SiemMetrics, PolicyDecision } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { DeviceBindingPage } from './components/DeviceBindingPage';
import { AccessPortalTab } from './components/AccessPortalTab';
import { DecisionPage } from './components/DecisionPage';
import { DevicePostureTab } from './components/DevicePostureTab';
import { PolicyStudioTab } from './components/PolicyStudioTab';
import { SiemDashboardTab } from './components/SiemDashboardTab';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('login');
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [metrics, setMetrics] = useState<SiemMetrics | null>(null);

  // Active Subject Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentDevice, setCurrentDevice] = useState<DeviceStatus | null>(null);
  const [mfaCode, setMfaCode] = useState<string>('123456');

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

  // Step 1: Login with ID, Password, and MFA
  const handleLoginSuccess = (user: User, code: string) => {
    setCurrentUser(user);
    setMfaCode(code);
    setIsAuthenticated(true);
    // Find user's default device if available
    const assignedDev = devices.find(d => user.assigned_devices?.includes(d.device_id)) || devices[0];
    if (assignedDev) {
      setCurrentDevice(assignedDev);
    }
    // Proceed to Step 2: Device
    setActiveTab('device');
    window.location.hash = '#/device';
  };

  // Step 2: Device Selection & Posture Binding
  const handleBindDevice = (device: DeviceStatus) => {
    setCurrentDevice(device);
    // Proceed to Step 3: Request Access (Catalog)
    setActiveTab('access');
    window.location.hash = '#/access';
  };

  // Step 3: Request Access -> Decision Generated
  const handleDecisionGenerated = (decision: PolicyDecision, resource: Resource) => {
    setLatestDecision(decision);
    setLatestResource(resource);
    // Proceed to Step 4: Verify & Give JWT Token
    setActiveTab('decision');
    window.location.hash = '#/decision';
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentDevice(null);
    setMfaCode('123456');
    setLatestDecision(null);
    setLatestResource(null);
    setActiveTab('login');
    window.location.hash = '';
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = `#/${tabId}`;
  };

  // Sync hash in URL with active tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const validTabs = ['device', 'access', 'decision', 'devices', 'policies', 'audit'];
      if (validTabs.includes(hash)) {
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
      
      {/* 1. Header with Multi-Step Navigation & Remaining Pages */}
      <Header
        metrics={metrics}
        onReset={handleResetSystem}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        currentDevice={currentDevice}
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

        {/* STEP 1: Login with ID, Password, and MFA */}
        {(!isAuthenticated || !currentUser) && (
          <LoginPage
            users={users}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* STEP 2: Device Selection & Posture Compliance */}
        {isAuthenticated && currentUser && activeTab === 'device' && (
          <DeviceBindingPage
            currentUser={currentUser}
            devices={devices}
            mfaCode={mfaCode}
            onBindDevice={handleBindDevice}
            onBackToLogin={handleLogout}
          />
        )}

        {/* STEP 3: Request Access (Application Catalog) */}
        {isAuthenticated && currentUser && activeTab === 'access' && (
          <AccessPortalTab
            currentUser={currentUser}
            currentDevice={currentDevice || devices[0]}
            mfaCode={mfaCode}
            resources={resources}
            onChangeDevice={() => handleTabChange('device')}
            onSwitchUser={handleLogout}
            onDecisionGenerated={handleDecisionGenerated}
          />
        )}

        {/* STEP 4: Verify & Give JWT Token with User Access */}
        {isAuthenticated && currentUser && activeTab === 'decision' && latestDecision && latestResource && (
          <DecisionPage
            decision={latestDecision}
            user={currentUser}
            device={currentDevice || devices[0]}
            resource={latestResource}
            onBackToCatalog={() => handleTabChange('access')}
            onGoToRemainingPages={(tabId) => handleTabChange(tabId)}
            onRequestJit={() => handleTabChange('access')}
            onPromptMfa={() => handleTabChange('access')}
          />
        )}

        {/* REMAINING PAGES: Policy Studio */}
        {isAuthenticated && activeTab === 'policies' && (
          <PolicyStudioTab
            policies={policies}
            resources={resources}
            onRefresh={loadData}
          />
        )}

        {/* REMAINING PAGES: Device Fleet Health */}
        {isAuthenticated && activeTab === 'devices' && (
          <DevicePostureTab
            devices={devices}
            onRefresh={loadData}
          />
        )}

        {/* REMAINING PAGES: SIEM & SOC Audit */}
        {isAuthenticated && activeTab === 'audit' && (
          <SiemDashboardTab
            metrics={metrics}
            onRefresh={loadData}
          />
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
