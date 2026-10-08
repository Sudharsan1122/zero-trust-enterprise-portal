import type {
  User, DeviceStatus, Resource, PolicyRule, PolicyDecision,
  AuditLogEntry, JITRequest, SiemMetrics
} from '../types';

const BASE_URL = '/api';

export const api = {
  // Users & Devices
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getDevices(): Promise<DeviceStatus[]> {
    const res = await fetch(`${BASE_URL}/devices`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async updateDevice(deviceId: string, updates: Partial<DeviceStatus>): Promise<DeviceStatus> {
    const res = await fetch(`${BASE_URL}/devices/${deviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update device');
    return res.json();
  },

  // Resources & Policies
  async getResources(): Promise<Resource[]> {
    const res = await fetch(`${BASE_URL}/resources`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  async getPolicies(): Promise<PolicyRule[]> {
    const res = await fetch(`${BASE_URL}/policies`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async createPolicy(policy: Partial<PolicyRule>): Promise<PolicyRule> {
    const res = await fetch(`${BASE_URL}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!res.ok) throw new Error('Failed to create policy');
    return res.json();
  },

  // Policy Decision Point (PDP)
  async requestAccess(payload: {
    username: string;
    device_id: string;
    resource_id: string;
    current_time?: string;
    client_ip?: string;
    location?: string;
    mfa_code?: string;
    jit_token?: string;
  }): Promise<PolicyDecision> {
    const res = await fetch(`${BASE_URL}/access/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Policy Decision evaluation failed');
    return res.json();
  },

  // Policy Enforcement Point (PEP) Gateway
  async fetchGatewayResource(
    resourceId: string,
    gatewayToken: string,
    deviceId: string
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/gateway/access/${resourceId}`, {
      headers: {
        'Authorization': `Bearer ${gatewayToken}`,
        'X-Device-ID': deviceId,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'PEP Gateway access denied' }));
      throw new Error(err.detail || 'Access denied by PEP Gateway');
    }
    return res.json();
  },

  // Just-In-Time Elevation
  async getJitRequests(): Promise<JITRequest[]> {
    const res = await fetch(`${BASE_URL}/jit/requests`);
    if (!res.ok) throw new Error('Failed to fetch JIT requests');
    return res.json();
  },

  async createJitRequest(payload: {
    username: string;
    resource_id: string;
    requested_duration_minutes: number;
    business_justification: string;
  }): Promise<JITRequest> {
    const res = await fetch(`${BASE_URL}/jit/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit JIT request');
    return res.json();
  },

  async approveJit(reqId: string, approver = 'diana.admin'): Promise<JITRequest> {
    const res = await fetch(`${BASE_URL}/jit/approve/${reqId}?approver=${encodeURIComponent(approver)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to approve JIT request');
    return res.json();
  },

  async rejectJit(reqId: string, approver = 'diana.admin'): Promise<JITRequest> {
    const res = await fetch(`${BASE_URL}/jit/reject/${reqId}?approver=${encodeURIComponent(approver)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reject JIT request');
    return res.json();
  },

  // SIEM & Auditing
  async getSiemMetrics(): Promise<SiemMetrics> {
    const res = await fetch(`${BASE_URL}/siem/metrics`);
    if (!res.ok) throw new Error('Failed to fetch SIEM metrics');
    return res.json();
  },

  async getSiemLogs(filters?: {
    verdict?: string;
    security_challenge?: string;
    username?: string;
  }): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    if (filters?.verdict) params.append('verdict', filters.verdict);
    if (filters?.security_challenge) params.append('security_challenge', filters.security_challenge);
    if (filters?.username) params.append('username', filters.username);

    const res = await fetch(`${BASE_URL}/siem/logs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch SIEM logs');
    return res.json();
  },

  async verifyAuditIntegrity(): Promise<{
    valid: boolean;
    total_records_checked: number;
    issues: string[];
    status: string;
  }> {
    const res = await fetch(`${BASE_URL}/siem/verify-integrity`, { method: 'POST' });
    if (!res.ok) throw new Error('Audit verification failed');
    return res.json();
  },

  async simulateAttack(attackType: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${BASE_URL}/siem/simulate-attack?attack_type=${encodeURIComponent(attackType)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Attack simulation failed');
    return res.json();
  },

  async resetSystem(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${BASE_URL}/system/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('System reset failed');
    return res.json();
  },
};
