import uuid
from datetime import datetime, timezone
from typing import Optional, List
from app.models.schemas import (
    AccessRequest, PolicyDecision, PolicyEvaluationResult, VerdictEnum,
    User, DeviceStatus, Resource, DeviceTrustLevel, SensitivityEnum, RoleEnum
)
from app.data.db import db
from app.engine.risk_engine import calculate_dynamic_risk, evaluate_access_time
from app.engine.posture_engine import evaluate_device_posture
from app.engine.jit import validate_active_jit
from app.security.auth import create_gateway_token, verify_mfa_code
from app.siem.logger import record_audit_event

def evaluate_access_request(req: AccessRequest) -> PolicyDecision:
    request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()
    policy_checks: List[PolicyEvaluationResult] = []

    # 1. Subject Identification (Authentication Check)
    user: Optional[User] = db.get_user(req.username)
    if not user:
        decision = PolicyDecision(
            request_id=request_id,
            timestamp=timestamp,
            username=req.username,
            role=RoleEnum.UNKNOWN,
            device_id=req.device_id,
            resource_id=req.resource_id,
            resource_name="Unknown",
            verdict=VerdictEnum.DENY,
            risk_score=95,
            risk_level="CRITICAL",
            decision_reason="Subject identity not found in enterprise identity store.",
            policy_checks=[
                PolicyEvaluationResult(rule_name="User Identity Verification", matched=True, passed=False, reason="Unknown subject ID")
            ],
            risk_assessment=calculate_dynamic_risk(
                User(id="anon", username=req.username, full_name="Anon", email="a@a.com", role="EMPLOYEE", department="None", clearance_level=SensitivityEnum.LOW), # type: ignore
                DeviceStatus(device_id="none", name="Unknown", owner_username="anon", os_name="Unknown", os_version="0", is_corporate_managed=False, is_firewall_enabled=False, is_antivirus_active=False, is_disk_encrypted=False, has_client_cert=False, trust_level=DeviceTrustLevel.COMPROMISED, ip_address="0.0.0.0", location="Unknown"),
                Resource(id="none", name="None", description="", icon="", category="", sensitivity=SensitivityEnum.LOW, endpoint_url="", allowed_roles=[])
            )
        )
        record_audit_event(
            request_id, req.username, "UNKNOWN", req.device_id, "UNKNOWN",
            req.resource_id, req.client_ip or "0.0.0.0", "Unknown", 95,
            VerdictEnum.DENY, "Unknown identity authentication failure", "Authentication"
        )
        return decision

    if not user.is_active:
        verdict = VerdictEnum.DENY
        reason = "Account is locked or de-provisioned."
        policy_checks.append(PolicyEvaluationResult(rule_name="Account Status", matched=True, passed=False, reason=reason))
        record_audit_event(
            request_id, user.username, user.role.value, req.device_id, "UNKNOWN",
            req.resource_id, req.client_ip or "0.0.0.0", "Unknown", 90,
            verdict, reason, "Authentication"
        )
        return PolicyDecision(
            request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
            device_id=req.device_id, resource_id=req.resource_id, resource_name="N/A",
            verdict=verdict, risk_score=90, risk_level="CRITICAL", decision_reason=reason,
            policy_checks=policy_checks,
            risk_assessment=calculate_dynamic_risk(user, DeviceStatus(device_id="none", name="Unknown", owner_username=user.username, os_name="Unknown", os_version="0", is_corporate_managed=False, is_firewall_enabled=False, is_antivirus_active=False, is_disk_encrypted=False, has_client_cert=False, trust_level=DeviceTrustLevel.COMPROMISED, ip_address="0.0.0.0", location="Unknown"), Resource(id="none", name="None", description="", icon="", category="", sensitivity=SensitivityEnum.LOW, endpoint_url="", allowed_roles=[]))
        )

    policy_checks.append(PolicyEvaluationResult(
        rule_name="Subject Authentication & Identity Verification",
        matched=True,
        passed=True,
        reason=f"Identity confirmed: {user.full_name} ({user.role.value})"
    ))

    # 2. Resource Resolution
    resource: Optional[Resource] = db.get_resource(req.resource_id)
    if not resource:
        verdict = VerdictEnum.DENY
        reason = f"Target resource '{req.resource_id}' does not exist."
        record_audit_event(request_id, user.username, user.role.value, req.device_id, "UNKNOWN", req.resource_id, req.client_ip or "0.0.0.0", "Unknown", 80, verdict, reason, "Authorization")
        return PolicyDecision(
            request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
            device_id=req.device_id, resource_id=req.resource_id, resource_name="Unknown",
            verdict=verdict, risk_score=80, risk_level="HIGH", decision_reason=reason,
            policy_checks=policy_checks,
            risk_assessment=calculate_dynamic_risk(user, DeviceStatus(device_id="none", name="Unknown", owner_username=user.username, os_name="Unknown", os_version="0", is_corporate_managed=False, is_firewall_enabled=False, is_antivirus_active=False, is_disk_encrypted=False, has_client_cert=False, trust_level=DeviceTrustLevel.COMPROMISED, ip_address="0.0.0.0", location="Unknown"), Resource(id="none", name="None", description="", icon="", category="", sensitivity=SensitivityEnum.LOW, endpoint_url="", allowed_roles=[]))
        )

    # 3. Device Identification & Posture Assessment
    device: Optional[DeviceStatus] = db.get_device(req.device_id)
    if not device:
        # Create unverified dynamic device status
        device = DeviceStatus(
            device_id=req.device_id,
            name="Unregistered Remote Endpoint",
            owner_username=user.username,
            os_name="Unknown OS",
            os_version="0.0",
            is_corporate_managed=False,
            is_firewall_enabled=False,
            is_antivirus_active=False,
            is_disk_encrypted=False,
            has_client_cert=False,
            trust_level=DeviceTrustLevel.UNPATCHED,
            ip_address=req.client_ip or "203.0.113.1",
            location=req.location or "Unknown External Location"
        )

    posture_trust, posture_score, remediation = evaluate_device_posture(device)

    # Device check against compromise
    if posture_trust == DeviceTrustLevel.COMPROMISED or device.jailbroken_or_rooted:
        policy_checks.append(PolicyEvaluationResult(
            rule_name="Device Integrity & Sandbox Verification",
            matched=True,
            passed=False,
            reason="Endpoint has been flagged as COMPROMISED or operating from malicious Tor network."
        ))
        record_audit_event(
            request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
            resource.id, req.client_ip or device.ip_address, device.location, 95,
            VerdictEnum.DENY, "Compromised device trust boundary violation", "Trust boundaries"
        )
        return PolicyDecision(
            request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
            device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
            verdict=VerdictEnum.DENY, risk_score=95, risk_level="CRITICAL",
            decision_reason="Endpoint sandbox failed verification. Host is compromised.",
            policy_checks=policy_checks,
            risk_assessment=calculate_dynamic_risk(user, device, resource, req.current_time, req.client_ip),
            remediation_steps=remediation
        )

    # 4. Corporate Device Requirement Policy
    if resource.requires_corporate_device and not device.is_corporate_managed:
        policy_checks.append(PolicyEvaluationResult(
            rule_name="Corporate Device Policy Check",
            matched=True,
            passed=False,
            reason=f"Resource '{resource.name}' strictly mandates a corporate-managed device with enterprise MDM enrollment."
        ))
        record_audit_event(
            request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
            resource.id, req.client_ip or device.ip_address, device.location, 65,
            VerdictEnum.REMEDIATION_REQUIRED, "Non-corporate device used for restricted resource", "Trust boundaries"
        )
        return PolicyDecision(
            request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
            device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
            verdict=VerdictEnum.REMEDIATION_REQUIRED, risk_score=65, risk_level="HIGH",
            decision_reason="Non-corporate BYOD endpoint denied access to restricted enterprise perimeter.",
            policy_checks=policy_checks,
            risk_assessment=calculate_dynamic_risk(user, device, resource, req.current_time, req.client_ip),
            remediation_steps=["Switch to an authorized corporate-managed laptop", "Enroll device into corporate MDM"]
        )
    else:
        policy_checks.append(PolicyEvaluationResult(
            rule_name="Device Health & Posture Compliance",
            matched=True,
            passed=True,
            reason=f"Device trust level: {posture_trust.value} (Health score: {posture_score}/100)"
        ))

    # 5. Dynamic Risk Assessment
    risk_assessment = calculate_dynamic_risk(user, device, resource, req.current_time, req.client_ip)
    
    # 6. Authorization (RBAC / ABAC Clearance)
    role_authorized = user.role in resource.allowed_roles
    has_active_jit = validate_active_jit(user.username, resource.id, req.jit_token)

    if not role_authorized:
        if has_active_jit:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Authorization & Least Privilege (RBAC)",
                matched=True,
                passed=True,
                reason="Standard role disallowed, but valid temporary Just-In-Time (JIT) elevation token verified."
            ))
        else:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Authorization & Least Privilege (RBAC)",
                matched=True,
                passed=False,
                reason=f"Role '{user.role.value}' does not possess required privilege for '{resource.name}'."
            ))
            # Check if user is eligible to request JIT (e.g. DEVOPS or FINANCE or ADMIN)
            is_jit_candidate = resource.sensitivity in [SensitivityEnum.HIGH, SensitivityEnum.CRITICAL] and user.role != "EMPLOYEE"
            verdict = VerdictEnum.JIT_REQUIRED if is_jit_candidate else VerdictEnum.DENY
            reason = "Privilege boundary violation: role unauthorized without JIT elevation." if verdict == VerdictEnum.JIT_REQUIRED else "Unauthorized role access attempt (least privilege violation)."
            
            record_audit_event(
                request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
                resource.id, req.client_ip or device.ip_address, device.location, risk_assessment.total_score,
                verdict, reason, "Privilege escalation" if not is_jit_candidate else "Least privilege"
            )
            return PolicyDecision(
                request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
                device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
                verdict=verdict, risk_score=risk_assessment.total_score, risk_level=risk_assessment.risk_level,
                decision_reason=reason,
                policy_checks=policy_checks,
                risk_assessment=risk_assessment,
                remediation_steps=["Submit Just-In-Time (JIT) access request with business justification"] if is_jit_candidate else ["Contact Security Administrator for permanent role assignment"]
            )
    else:
        policy_checks.append(PolicyEvaluationResult(
            rule_name="Authorization & Least Privilege (RBAC)",
            matched=True,
            passed=True,
            reason=f"Role '{user.role.value}' matches authorized access control matrix."
        ))

    # 7. Temporal Access Restriction Check
    is_biz_hours = evaluate_access_time(req.current_time)
    if resource.business_hours_only and not is_biz_hours:
        if not has_active_jit:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Temporal Access Window Policy",
                matched=True,
                passed=False,
                reason=f"Resource '{resource.name}' is restricted to corporate business hours (08:00 - 18:00)."
            ))
            record_audit_event(
                request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
                resource.id, req.client_ip or device.ip_address, device.location, risk_assessment.total_score,
                VerdictEnum.JIT_REQUIRED, "Off-hours access requires emergency JIT elevation token", "Policy enforcement"
            )
            return PolicyDecision(
                request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
                device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
                verdict=VerdictEnum.JIT_REQUIRED, risk_score=risk_assessment.total_score, risk_level=risk_assessment.risk_level,
                decision_reason="Access requested outside business hours. Emergency JIT elevation required.",
                policy_checks=policy_checks,
                risk_assessment=risk_assessment,
                remediation_steps=["Request emergency after-hours JIT ticket"]
            )
        else:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Temporal Access Window Policy",
                matched=True,
                passed=True,
                reason="After-hours access authorized under active emergency JIT elevation ticket."
            ))
    else:
        policy_checks.append(PolicyEvaluationResult(
            rule_name="Temporal Access Window Policy",
            matched=True,
            passed=True,
            reason="Access timing conforms to policy schedule."
        ))

    # 8. Dynamic Risk Tolerance Check
    if risk_assessment.total_score > resource.max_risk_tolerance:
        # Check if risk can be mitigated via MFA Step-Up
        if risk_assessment.total_score <= (resource.max_risk_tolerance + 25) and not req.mfa_code:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Continuous Risk Engine Evaluation",
                matched=True,
                passed=False,
                reason=f"Dynamic risk score ({risk_assessment.total_score}) exceeds baseline tolerance ({resource.max_risk_tolerance}). Step-up MFA challenge invoked."
            ))
            record_audit_event(
                request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
                resource.id, req.client_ip or device.ip_address, device.location, risk_assessment.total_score,
                VerdictEnum.MFA_REQUIRED, "Elevated risk requires step-up MFA verification", "Authentication"
            )
            return PolicyDecision(
                request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
                device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
                verdict=VerdictEnum.MFA_REQUIRED, risk_score=risk_assessment.total_score, risk_level=risk_assessment.risk_level,
                decision_reason="Contextual risk is elevated. Complete Step-up Multi-Factor Authentication to proceed.",
                policy_checks=policy_checks,
                risk_assessment=risk_assessment,
                remediation_steps=["Provide 6-digit TOTP verification code (demo: 123456)"]
            )
        else:
            if not req.mfa_code or not verify_mfa_code(user.mfa_secret, req.mfa_code):
                policy_checks.append(PolicyEvaluationResult(
                    rule_name="Continuous Risk Engine Evaluation",
                    matched=True,
                    passed=False,
                    reason=f"Dynamic risk score ({risk_assessment.total_score}) exceeds acceptable risk threshold ({resource.max_risk_tolerance}). Access blocked."
                ))
                record_audit_event(
                    request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
                    resource.id, req.client_ip or device.ip_address, device.location, risk_assessment.total_score,
                    VerdictEnum.DENY, "High risk tolerance violation", "Policy enforcement"
                )
                return PolicyDecision(
                    request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
                    device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
                    verdict=VerdictEnum.DENY, risk_score=risk_assessment.total_score, risk_level=risk_assessment.risk_level,
                    decision_reason="Dynamic risk score exceeds maximum safe threshold. Connection rejected by PEP.",
                    policy_checks=policy_checks,
                    risk_assessment=risk_assessment,
                    remediation_steps=["Remediate endpoint posture", "Connect from corporate internal network", "Clear security alerts with admin"]
                )
    else:
        policy_checks.append(PolicyEvaluationResult(
            rule_name="Continuous Risk Engine Evaluation",
            matched=True,
            passed=True,
            reason=f"Dynamic risk score ({risk_assessment.total_score}) is within acceptable tolerance ({resource.max_risk_tolerance})."
        ))

    # 9. MFA Requirement Check (Mandatory by Resource or High Risk)
    if (resource.requires_mfa or risk_assessment.total_score >= 35):
        if not req.mfa_code:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Multi-Factor Authentication (MFA) Step-Up",
                matched=True,
                passed=False,
                reason="Resource or contextual policy requires Step-Up MFA challenge verification."
            ))
            record_audit_event(
                request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
                resource.id, req.client_ip or device.ip_address, device.location, risk_assessment.total_score,
                VerdictEnum.MFA_REQUIRED, "Step-Up MFA challenge required", "Authentication"
            )
            return PolicyDecision(
                request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
                device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
                verdict=VerdictEnum.MFA_REQUIRED, risk_score=risk_assessment.total_score, risk_level=risk_assessment.risk_level,
                decision_reason="Step-Up MFA verification required for this sensitive asset.",
                policy_checks=policy_checks,
                risk_assessment=risk_assessment,
                remediation_steps=["Enter 6-digit MFA token (demo: 123456)"]
            )
        elif not verify_mfa_code(user.mfa_secret, req.mfa_code):
            user.failed_attempts += 1
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Multi-Factor Authentication (MFA) Step-Up",
                matched=True,
                passed=False,
                reason="Provided TOTP / MFA code was invalid."
            ))
            record_audit_event(
                request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
                resource.id, req.client_ip or device.ip_address, device.location, min(100, risk_assessment.total_score + 15),
                VerdictEnum.DENY, "Failed MFA verification challenge", "Authentication"
            )
            return PolicyDecision(
                request_id=request_id, timestamp=timestamp, username=user.username, role=user.role,
                device_id=device.device_id, resource_id=resource.id, resource_name=resource.name,
                verdict=VerdictEnum.DENY, risk_score=min(100, risk_assessment.total_score + 15), risk_level="HIGH",
                decision_reason="Authentication failed: invalid MFA token supplied.",
                policy_checks=policy_checks,
                risk_assessment=risk_assessment,
                remediation_steps=["Verify authenticator app time-sync and try again"]
            )
        else:
            policy_checks.append(PolicyEvaluationResult(
                rule_name="Multi-Factor Authentication (MFA) Step-Up",
                matched=True,
                passed=True,
                reason="MFA TOTP code cryptographically verified."
            ))

    # All Zero Trust Checks Passed! Issue Short-Lived Device-Bound Gateway Token
    gateway_token = create_gateway_token(
        username=user.username,
        role=user.role.value,
        resource_id=resource.id,
        device_id=device.device_id,
        risk_score=risk_assessment.total_score,
        expires_in_minutes=15
    )

    record_audit_event(
        request_id, user.username, user.role.value, device.device_id, device.trust_level.value,
        resource.id, req.client_ip or device.ip_address, device.location, risk_assessment.total_score,
        VerdictEnum.ALLOW, "Zero Trust verification fully satisfied - Gateway token minted", "Policy enforcement"
    )

    return PolicyDecision(
        request_id=request_id,
        timestamp=timestamp,
        username=user.username,
        role=user.role,
        device_id=device.device_id,
        resource_id=resource.id,
        resource_name=resource.name,
        verdict=VerdictEnum.ALLOW,
        risk_score=risk_assessment.total_score,
        risk_level=risk_assessment.risk_level,
        decision_reason="All zero-trust identity, posture, temporal, and policy conditions passed. Session authorized.",
        policy_checks=policy_checks,
        risk_assessment=risk_assessment,
        gateway_token=gateway_token
    )
