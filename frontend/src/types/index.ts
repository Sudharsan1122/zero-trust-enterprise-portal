export type RoleEnum = 
  | 'EMPLOYEE'
  | 'FINANCE_OFFICER'
  | 'DEVOPS_ENGINEER'
  | 'CONTRACTOR'
  | 'SECURITY_ADMIN'
  | 'AUDITOR';

export type SensitivityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DeviceTrustLevel = 
  | 'COMPLIANT_CORPORATE'
  | 'REGISTERED_BYOD'
  | 'UNPATCHED'
  | 'COMPROMISED';

export type VerdictEnum = 
  | 'ALLOW'
  | 'DENY'
  | 'MFA_REQUIRED'
  | 'REMEDIATION_REQUIRED'
  | 'JIT_REQUIRED';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: RoleEnum;
  department: string;
  clearance_level: SensitivityEnum;
  mfa_enabled: boolean;
  failed_attempts: number;
  assigned_devices: string[];
}

export interface DeviceStatus {
  device_id: string;
  name: string;
  owner_username: string;
  os_name: string;
  os_version: string;
  is_corporate_managed: boolean;
  is_firewall_enabled: boolean;
  is_antivirus_active: boolean;
  is_disk_encrypted: boolean;
  has_client_cert: boolean;
  trust_level: DeviceTrustLevel;
  ip_address: string;
  location: string;
  jailbroken_or_rooted: boolean;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  sensitivity: SensitivityEnum;
  endpoint_url: string;
  allowed_roles: RoleEnum[];
  requires_corporate_device: boolean;
  requires_mfa: boolean;
  business_hours_only: boolean;
  max_risk_tolerance: number;
  sample_payload: Record<string, any>;
}

export interface RiskFactor {
  factor_name: string;
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface RiskAssessment {
  total_score: number;
  risk_level: string;
  factors: RiskFactor[];
}

export interface PolicyEvaluationResult {
  rule_name: string;
  matched: boolean;
  passed: boolean;
  reason: string;
}

export interface PolicyDecision {
  request_id: string;
  timestamp: string;
  username: string;
  role: RoleEnum;
  device_id: string;
  resource_id: string;
  resource_name: string;
  verdict: VerdictEnum;
  risk_score: number;
  risk_level: string;
  decision_reason: string;
  policy_checks: PolicyEvaluationResult[];
  risk_assessment: RiskAssessment;
  gateway_token?: string;
  remediation_steps?: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  request_id: string;
  username: string;
  role: string;
  device_id: string;
  device_trust: string;
  resource_id: string;
  ip_address: string;
  location: string;
  risk_score: number;
  verdict: string;
  reason: string;
  security_challenge: string;
  prev_hash: string;
  entry_hash: string;
}

export interface JITRequest {
  id: string;
  username: string;
  resource_id: string;
  resource_name: string;
  duration_minutes: number;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requested_at: string;
  expires_at?: string;
  approved_by?: string;
  jit_token?: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  resource_id?: string;
  required_roles?: RoleEnum[];
  min_device_trust?: DeviceTrustLevel;
  max_risk_allowed: number;
  allow_after_hours: boolean;
  require_mfa: boolean;
  enabled: boolean;
}

export interface SiemMetrics {
  summary: {
    total_evaluations: number;
    allowed_count: number;
    denied_count: number;
    mfa_challenged_count: number;
    jit_required_count: number;
    remediation_count: number;
    average_risk_score: number;
    threat_level: string;
  };
  breakdown_by_security_challenge: Record<string, number>;
  audit_chain_status: {
    is_immutable_chain_valid: boolean;
    total_blocks: number;
    tamper_issues: string[];
  };
  recent_alerts: any[];
}
