from fastapi import FastAPI, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uuid

from app.models.schemas import (
    User, DeviceStatus, Resource, PolicyRule, AccessRequest, PolicyDecision,
    AuditLogEntry, JITRequest, JITRequestCreate, VerdictEnum
)
from app.data.db import db
from app.engine.pdp import evaluate_access_request
from app.engine.pep import enforce_gateway_access
from app.engine.jit import create_jit_request, approve_jit_request, reject_jit_request
from app.siem.logger import verify_audit_integrity, record_audit_event
from app.siem.analytics import get_siem_dashboard_metrics

app = FastAPI(
    title="Zero-Trust Enterprise Access Portal",
    description="NIST SP 800-207 Zero Trust Architecture (ZTA) Platform with Dynamic Risk Scoring, PDP/PEP, JIT, and SIEM",
    version="1.0.0"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "OPERATIONAL",
        "system": "Zero-Trust Enterprise Access Portal (NIST SP 800-207)",
        "pdp_status": "ONLINE",
        "pep_status": "ONLINE",
        "active_rules": len(db.list_policies()),
        "audit_chain_length": len(db.audit_logs)
    }

# ----------------- ENTITIES & CONTEXT -----------------

@app.get("/api/users", response_model=List[User])
def get_users():
    return db.list_users()

@app.get("/api/devices", response_model=List[DeviceStatus])
def get_devices():
    return db.list_devices()

@app.patch("/api/devices/{device_id}", response_model=DeviceStatus)
def update_device_status(device_id: str, updates: Dict[str, Any]):
    updated = db.update_device(device_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Device not found")
    return updated

@app.get("/api/resources", response_model=List[Resource])
def get_resources():
    return db.list_resources()

@app.get("/api/policies", response_model=List[PolicyRule])
def get_policies():
    return db.list_policies()

@app.post("/api/policies", response_model=PolicyRule)
def create_policy(policy: PolicyRule):
    if not policy.id:
        policy.id = f"POL-{uuid.uuid4().hex[:6].upper()}"
    db.policies[policy.id] = policy
    return policy

# ----------------- POLICY DECISION POINT (PDP) -----------------

@app.post("/api/access/request", response_model=PolicyDecision)
@app.post("/api/pdp/evaluate", response_model=PolicyDecision)
def request_access(request: AccessRequest):
    """
    Core Policy Decision Point (PDP) endpoint.
    Ingests identity, device posture, resource attributes, time, and calculated risk
    to make an authoritative Zero Trust verdict.
    """
    decision = evaluate_access_request(request)
    return decision

# ----------------- POLICY ENFORCEMENT POINT (PEP) -----------------

@app.get("/api/gateway/access/{resource_id}")
def gateway_access_proxy(
    resource_id: str,
    authorization: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None)
):
    """
    Policy Enforcement Point (PEP) Gatekeeper.
    Intercepts communication, verifies device-bound gateway token, and proxies data.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    device_id = x_device_id or "UNKNOWN-DEVICE"

    try:
        data = enforce_gateway_access(
            resource_id=resource_id,
            gateway_token=token,
            current_device_id=device_id
        )
        return data
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------- JUST-IN-TIME (JIT) ELEVATION -----------------

@app.get("/api/jit/requests", response_model=List[JITRequest])
def list_jit_requests():
    return db.list_jit_requests()

@app.post("/api/jit/request", response_model=JITRequest)
def submit_jit_request(body: JITRequestCreate):
    user = db.get_user(body.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    resource = db.get_resource(body.resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    req = create_jit_request(body, user, resource)
    return req

@app.post("/api/jit/approve/{req_id}", response_model=JITRequest)
def approve_jit(req_id: str, approver: str = Query("diana.admin")):
    approved = approve_jit_request(req_id, approver)
    if not approved:
        raise HTTPException(status_code=400, detail="Cannot approve JIT ticket (not found or not pending)")
    return approved

@app.post("/api/jit/reject/{req_id}", response_model=JITRequest)
def reject_jit(req_id: str, approver: str = Query("diana.admin")):
    rejected = reject_jit_request(req_id, approver)
    if not rejected:
        raise HTTPException(status_code=400, detail="Cannot reject JIT ticket")
    return rejected

# ----------------- SIEM & SECURITY OPERATIONS -----------------

@app.get("/api/siem/metrics")
def get_siem_metrics():
    return get_siem_dashboard_metrics()

@app.get("/api/siem/logs", response_model=List[AuditLogEntry])
def get_siem_logs(
    verdict: Optional[str] = None,
    security_challenge: Optional[str] = None,
    username: Optional[str] = None,
    limit: int = 50
):
    results = db.audit_logs
    if verdict:
        results = [l for l in results if l.verdict.upper() == verdict.upper()]
    if security_challenge:
        results = [l for l in results if l.security_challenge.lower() == security_challenge.lower()]
    if username:
        results = [l for l in results if l.username.lower() == username.lower()]
    return results[:limit]

@app.post("/api/siem/verify-integrity")
def check_audit_integrity():
    valid, issues = verify_audit_integrity()
    return {
        "valid": valid,
        "total_records_checked": len(db.audit_logs),
        "issues": issues,
        "status": "SECURE: Cryptographic chain unbroken" if valid else "ALERT: Audit tampering detected!"
    }

@app.post("/api/siem/simulate-attack")
def simulate_attack(attack_type: str = Query(...)):
    """
    Injects simulated attack scenarios to demonstrate Zero Trust defenses:
    - 'brute_force': Rapid failed authentication attempts
    - 'tor_ingress': Ingress from an anonymized Tor Exit node
    - 'unpatched_exploit': Outdated unpatched endpoint accessing critical banking ledger
    - 'privilege_escalation': Contractor trying to access GDPR customer PII
    - 'tamper_log': Deliberate tampering of audit log to trigger cryptographic chain alarm
    - 'session_hijack': Replay of ThinkPad gateway token on Rogue device
    """
    if attack_type == "brute_force":
        for i in range(4):
            record_audit_event(
                request_id=f"ATK-BF-{uuid.uuid4().hex[:6]}",
                username="eve.attacker",
                role="EMPLOYEE",
                device_id="DEV-ROGUE-99",
                device_trust="COMPROMISED",
                resource_id="RES-FIN-01",
                ip_address="185.220.101.5",
                location="Tor Exit Node",
                risk_score=95,
                verdict=VerdictEnum.DENY,
                reason=f"Credential stuffing attempt #{i+1} blocked by rate limiter & risk engine",
                security_challenge="Authentication"
            )
        if "eve.attacker" in db.users:
            db.users["eve.attacker"].failed_attempts += 4
        return {"status": "SUCCESS", "message": "Brute-force attack simulated. Failed attempts incremented & logged."}

    elif attack_type == "tor_ingress":
        record_audit_event(
            request_id=f"ATK-TOR-{uuid.uuid4().hex[:6]}",
            username="eve.attacker",
            role="EMPLOYEE",
            device_id="DEV-ROGUE-99",
            device_trust="COMPROMISED",
            resource_id="RES-K8S-01",
            ip_address="185.220.101.5",
            location="Tor Anonymizer Node",
            risk_score=98,
            verdict=VerdictEnum.DENY,
            reason="Blocked by PEP Trust Boundary: Tor Exit IP blacklisted",
            security_challenge="Trust boundaries"
        )
        return {"status": "SUCCESS", "message": "Tor ingress attack intercepted and blocked by Trust Boundary policy."}

    elif attack_type == "privilege_escalation":
        record_audit_event(
            request_id=f"ATK-ESC-{uuid.uuid4().hex[:6]}",
            username="charlie.contractor",
            role="CONTRACTOR",
            device_id="DEV-BYOD-01",
            device_trust="REGISTERED_BYOD",
            resource_id="RES-CUST-PII",
            ip_address="172.56.21.90",
            location="Boston Remote",
            risk_score=85,
            verdict=VerdictEnum.DENY,
            reason="Privilege escalation blocked: Vendor role cannot access GDPR PII Vault",
            security_challenge="Privilege escalation"
        )
        return {"status": "SUCCESS", "message": "Privilege escalation attempt intercepted by RBAC/ABAC PDP."}

    elif attack_type == "tamper_log":
        if len(db.audit_logs) > 0:
            target = db.audit_logs[0]
            # Deliberately modify record without recomputing hash to trigger chain breakage
            target.reason = "TAMPERED: Attacker erased evidence of intrusion!"
            target.verdict = "ALLOW" # Attacker tried to cover tracks
            return {
                "status": "SUCCESS",
                "message": f"Log {target.id} was intentionally altered. Run Cryptographic Integrity Check to see SIEM detect the tampering!"
            }
        else:
            return {"status": "ERROR", "message": "No logs to tamper with. Trigger an access event first."}

    elif attack_type == "session_hijack":
        record_audit_event(
            request_id=f"ATK-HIJACK-{uuid.uuid4().hex[:6]}",
            username="alice.finance",
            role="FINANCE_OFFICER",
            device_id="DEV-ROGUE-99",
            device_trust="COMPROMISED",
            resource_id="RES-FIN-01",
            ip_address="185.220.101.5",
            location="Tor Exit Node",
            risk_score=99,
            verdict=VerdictEnum.DENY,
            reason="Device Hijack Detected: Token bound to DEV-CORP-01 replayed on rogue device DEV-ROGUE-99",
            security_challenge="Privilege escalation"
        )
        return {"status": "SUCCESS", "message": "Session Hijack / Replay attack intercepted via cryptographic device-binding."}

    raise HTTPException(status_code=400, detail="Unknown attack simulation type")

@app.post("/api/system/reset")
def reset_system():
    db.reset()
    # Add initial seed audit events
    init_audit_seed()
    return {"status": "RESET_COMPLETE", "message": "Zero Trust database, devices, and policies restored to initial baseline."}

def init_audit_seed():
    """Populates baseline SIEM logs so the dashboard is immediately rich with insights."""
    events = [
        ("USR-001", "alice.finance", "FINANCE_OFFICER", "DEV-CORP-01", "COMPLIANT_CORPORATE", "RES-FIN-01", "10.14.22.105", "New York HQ", 15, VerdictEnum.ALLOW, "Corporate device verified during business hours", "Policy enforcement"),
        ("USR-002", "bob.devops", "DEVOPS_ENGINEER", "DEV-CORP-02", "COMPLIANT_CORPORATE", "RES-K8S-01", "10.14.22.110", "New York HQ", 20, VerdictEnum.ALLOW, "Kubernetes cluster access authorized with corporate cert", "Least privilege"),
        ("USR-003", "charlie.contractor", "CONTRACTOR", "DEV-BYOD-01", "REGISTERED_BYOD", "RES-WIKI-01", "172.56.21.90", "Boston Remote", 25, VerdictEnum.ALLOW, "Internal wiki permitted for external contractors", "Authorization"),
        ("USR-005", "eve.attacker", "EMPLOYEE", "DEV-ROGUE-99", "COMPROMISED", "RES-K8S-01", "185.220.101.5", "Tor Exit Node", 95, VerdictEnum.DENY, "Compromised sandbox & untrusted anonymous network", "Trust boundaries"),
        ("USR-003", "charlie.contractor", "CONTRACTOR", "DEV-UNPATCH-01", "UNPATCHED", "RES-FIN-01", "198.51.100.42", "Chicago Public Wi-Fi", 85, VerdictEnum.DENY, "Least privilege violation: Contractor barred from Banking Core", "Authorization"),
        ("USR-001", "alice.finance", "FINANCE_OFFICER", "DEV-BYOD-01", "REGISTERED_BYOD", "RES-HR-01", "172.56.21.90", "Boston Remote", 45, VerdictEnum.MFA_REQUIRED, "Off-premise BYOD requesting HR records: step-up MFA challenge invoked", "Authentication")
    ]
    for uid, u, r, d, dt, res, ip, loc, score, verd, reas, chal in events:
        record_audit_event(
            request_id=f"INIT-{uuid.uuid4().hex[:6]}",
            username=u,
            role=r,
            device_id=d,
            device_trust=dt,
            resource_id=res,
            ip_address=ip,
            location=loc,
            risk_score=score,
            verdict=verd,
            reason=reas,
            security_challenge=chal
        )

# Initialize seed audit records on startup
init_audit_seed()
