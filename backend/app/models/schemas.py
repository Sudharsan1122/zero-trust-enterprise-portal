from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class RoleEnum(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    FINANCE_OFFICER = "FINANCE_OFFICER"
    DEVOPS_ENGINEER = "DEVOPS_ENGINEER"
    CONTRACTOR = "CONTRACTOR"
    SECURITY_ADMIN = "SECURITY_ADMIN"
    AUDITOR = "AUDITOR"
    UNKNOWN = "UNKNOWN"

class SensitivityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class DeviceTrustLevel(str, Enum):
    COMPLIANT_CORPORATE = "COMPLIANT_CORPORATE"
    REGISTERED_BYOD = "REGISTERED_BYOD"
    UNPATCHED = "UNPATCHED"
    COMPROMISED = "COMPROMISED"

class VerdictEnum(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    MFA_REQUIRED = "MFA_REQUIRED"
    REMEDIATION_REQUIRED = "REMEDIATION_REQUIRED"
    JIT_REQUIRED = "JIT_REQUIRED"

class DeviceStatus(BaseModel):
    device_id: str
    name: str
    owner_username: str
    os_name: str
    os_version: str
    is_corporate_managed: bool
    is_firewall_enabled: bool
    is_antivirus_active: bool
    is_disk_encrypted: bool
    has_client_cert: bool
    trust_level: DeviceTrustLevel
    ip_address: str
    location: str
    jailbroken_or_rooted: bool = False

class User(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    role: RoleEnum
    department: str
    clearance_level: SensitivityEnum
    mfa_enabled: bool = True
    mfa_secret: str = "JBSWY3DPEHPK3PXP" # Base32 mock seed
    is_active: bool = True
    failed_attempts: int = 0
    assigned_devices: List[str] = []

class Resource(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    sensitivity: SensitivityEnum
    endpoint_url: str
    allowed_roles: List[RoleEnum]
    requires_corporate_device: bool = False
    requires_mfa: bool = False
    business_hours_only: bool = False
    max_risk_tolerance: int = 50 # Risk score must be <= this value to allow
    sample_payload: Dict[str, Any] = {}

class AccessRequest(BaseModel):
    username: str
    device_id: str
    resource_id: str
    current_time: Optional[str] = None # ISO format or HH:MM
    client_ip: Optional[str] = None
    location: Optional[str] = None
    mfa_code: Optional[str] = None
    jit_token: Optional[str] = None

class RiskFactor(BaseModel):
    factor_name: str
    score: int
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    description: str

class RiskAssessment(BaseModel):
    total_score: int # 0 to 100
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    factors: List[RiskFactor]

class PolicyEvaluationResult(BaseModel):
    rule_name: str
    matched: bool
    passed: bool
    reason: str

class PolicyDecision(BaseModel):
    request_id: str
    timestamp: str
    username: str
    role: RoleEnum
    device_id: str
    resource_id: str
    resource_name: str
    verdict: VerdictEnum
    risk_score: int
    risk_level: str
    decision_reason: str
    policy_checks: List[PolicyEvaluationResult]
    risk_assessment: RiskAssessment
    gateway_token: Optional[str] = None
    remediation_steps: Optional[List[str]] = None

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    request_id: str
    username: str
    role: str
    device_id: str
    device_trust: str
    resource_id: str
    ip_address: str
    location: str
    risk_score: int
    verdict: str
    reason: str
    security_challenge: str # Authentication, Authorization, Least privilege, etc.
    prev_hash: str
    entry_hash: str

class JITRequestCreate(BaseModel):
    username: str
    resource_id: str
    requested_duration_minutes: int = 15
    business_justification: str

class JITRequest(BaseModel):
    id: str
    username: str
    resource_id: str
    resource_name: str
    duration_minutes: int
    justification: str
    status: str # PENDING, APPROVED, REJECTED, EXPIRED
    requested_at: str
    expires_at: Optional[str] = None
    approved_by: Optional[str] = None
    jit_token: Optional[str] = None

class PolicyRule(BaseModel):
    id: str
    name: str
    description: str
    resource_id: Optional[str] = None # None means all resources
    required_roles: Optional[List[RoleEnum]] = None
    min_device_trust: Optional[DeviceTrustLevel] = None
    max_risk_allowed: int = 60
    allow_after_hours: bool = False
    require_mfa: bool = False
    enabled: bool = True
