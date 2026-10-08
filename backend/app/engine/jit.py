import uuid
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
from app.models.schemas import JITRequest, JITRequestCreate, User, Resource
from app.data.db import db
from app.config import JIT_TOKEN_EXPIRE_MINUTES

def create_jit_request(data: JITRequestCreate, user: User, resource: Resource) -> JITRequest:
    req_id = f"JIT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)
    
    req = JITRequest(
        id=req_id,
        username=user.username,
        resource_id=resource.id,
        resource_name=resource.name,
        duration_minutes=data.requested_duration_minutes or JIT_TOKEN_EXPIRE_MINUTES,
        justification=data.business_justification,
        status="PENDING",
        requested_at=now.isoformat()
    )

    # Auto-approve if requested by SECURITY_ADMIN, or keep PENDING for approval
    if user.role.value == "SECURITY_ADMIN":
        req.status = "APPROVED"
        req.approved_by = "SECURITY_ADMIN_AUTO"
        req.expires_at = (now + timedelta(minutes=req.duration_minutes)).isoformat()
        req.jit_token = f"JIT-GRANT-{uuid.uuid4().hex}"

    db.add_jit_request(req)
    return req

def approve_jit_request(req_id: str, approver_username: str) -> Optional[JITRequest]:
    req = db.get_jit_request(req_id)
    if not req or req.status != "PENDING":
        return None

    now = datetime.now(timezone.utc)
    req.status = "APPROVED"
    req.approved_by = approver_username
    req.expires_at = (now + timedelta(minutes=req.duration_minutes)).isoformat()
    req.jit_token = f"JIT-GRANT-{uuid.uuid4().hex}"
    return req

def reject_jit_request(req_id: str, approver_username: str) -> Optional[JITRequest]:
    req = db.get_jit_request(req_id)
    if not req or req.status != "PENDING":
        return None

    req.status = "REJECTED"
    req.approved_by = approver_username
    return req

def validate_active_jit(username: str, resource_id: str, jit_token: Optional[str]) -> bool:
    if not jit_token:
        return False
    
    now = datetime.now(timezone.utc)
    for req in db.list_jit_requests():
        if (req.username == username and 
            req.resource_id == resource_id and 
            req.jit_token == jit_token and 
            req.status == "APPROVED"):
            if req.expires_at:
                try:
                    exp = datetime.fromisoformat(req.expires_at)
                    if now < exp:
                        return True
                    else:
                        req.status = "EXPIRED"
                except Exception:
                    pass
    return False
