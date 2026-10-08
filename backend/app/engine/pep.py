import uuid
from typing import Dict, Any, Optional
from app.models.schemas import Resource, VerdictEnum
from app.data.db import db
from app.security.auth import verify_gateway_token
from app.siem.logger import record_audit_event

def enforce_gateway_access(
    resource_id: str,
    gateway_token: Optional[str],
    current_device_id: str
) -> Dict[str, Any]:
    """
    Policy Enforcement Point (PEP) acting as the microsegmented Zero Trust ingress proxy.
    Only allows access if a valid, unexpired, device-bound gateway token is presented.
    """
    request_id = f"PEP-{uuid.uuid4().hex[:8].upper()}"
    resource = db.get_resource(resource_id)
    if not resource:
        raise ValueError(f"Target internal application '{resource_id}' does not exist.")

    if not gateway_token:
        record_audit_event(
            request_id=request_id,
            username="ANONYMOUS",
            role="UNAUTHENTICATED",
            device_id=current_device_id,
            device_trust="UNKNOWN",
            resource_id=resource_id,
            ip_address="0.0.0.0",
            location="Untrusted Gateway Boundary",
            risk_score=90,
            verdict=VerdictEnum.DENY,
            reason="Direct unauthorized access attempt without PEP Gateway Token.",
            security_challenge="Trust boundaries"
        )
        raise PermissionError("Access Denied by PEP Gateway: Missing Zero Trust Gateway Token. Authentication required.")

    # Cryptographic token validation with device binding
    try:
        claims = verify_gateway_token(
            token=gateway_token,
            expected_resource_id=resource_id,
            current_device_id=current_device_id
        )
    except Exception as e:
        record_audit_event(
            request_id=request_id,
            username="UNVERIFIED",
            role="UNKNOWN",
            device_id=current_device_id,
            device_trust="UNKNOWN",
            resource_id=resource_id,
            ip_address="0.0.0.0",
            location="Untrusted Gateway Boundary",
            risk_score=95,
            verdict=VerdictEnum.DENY,
            reason=f"PEP Token Verification Failed: {str(e)}",
            security_challenge="Privilege escalation"
        )
        raise PermissionError(f"Access Denied by PEP Gateway: {str(e)}")

    # Authorized! PEP proxies payload from the internal app
    return {
        "status": "AUTHORIZED",
        "gateway_node": "PEP-GATEWAY-CLUSTER-01",
        "session_claims": claims,
        "resource": {
            "id": resource.id,
            "name": resource.name,
            "category": resource.category,
            "sensitivity": resource.sensitivity.value,
            "endpoint_url": resource.endpoint_url
        },
        "protected_data": resource.sample_payload
    }
