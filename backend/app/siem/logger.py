import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from app.models.schemas import AuditLogEntry, VerdictEnum
from app.data.db import db

def compute_entry_hash(prev_hash: str, log_data: dict) -> str:
    raw = f"{prev_hash}|{log_data.get('timestamp')}|{log_data.get('request_id')}|" \
          f"{log_data.get('username')}|{log_data.get('device_id')}|{log_data.get('resource_id')}|" \
          f"{log_data.get('risk_score')}|{log_data.get('verdict')}|{log_data.get('reason')}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def record_audit_event(
    request_id: str,
    username: str,
    role: str,
    device_id: str,
    device_trust: str,
    resource_id: str,
    ip_address: str,
    location: str,
    risk_score: int,
    verdict: VerdictEnum,
    reason: str,
    security_challenge: str
) -> AuditLogEntry:
    timestamp = datetime.now(timezone.utc).isoformat()
    log_id = f"LOG-{uuid.uuid4().hex[:10].upper()}"

    prev_hash = db.last_log_hash
    data_dict = {
        "timestamp": timestamp,
        "request_id": request_id,
        "username": username,
        "device_id": device_id,
        "resource_id": resource_id,
        "risk_score": risk_score,
        "verdict": verdict.value,
        "reason": reason
    }
    entry_hash = compute_entry_hash(prev_hash, data_dict)

    entry = AuditLogEntry(
        id=log_id,
        timestamp=timestamp,
        request_id=request_id,
        username=username,
        role=role,
        device_id=device_id,
        device_trust=device_trust,
        resource_id=resource_id,
        ip_address=ip_address,
        location=location,
        risk_score=risk_score,
        verdict=verdict.value,
        reason=reason,
        security_challenge=security_challenge,
        prev_hash=prev_hash,
        entry_hash=entry_hash
    )

    db.audit_logs.insert(0, entry) # Most recent first
    db.last_log_hash = entry_hash
    return entry

def verify_audit_integrity() -> Tuple[bool, List[str]]:
    """
    Verifies cryptographic hash continuity of the entire SIEM audit chain.
    Detects if any log entries were deleted, altered, or injected.
    """
    issues = []
    # Logs are stored newest-first in db.audit_logs, so iterate in chronological order (reversed)
    ordered = list(reversed(db.audit_logs))
    
    expected_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    for i, entry in enumerate(ordered):
        if entry.prev_hash != expected_prev:
            issues.append(f"Broken Hash Chain at Log #{i} ({entry.id}): prev_hash mismatch!")
        
        data_dict = {
            "timestamp": entry.timestamp,
            "request_id": entry.request_id,
            "username": entry.username,
            "device_id": entry.device_id,
            "resource_id": entry.resource_id,
            "risk_score": entry.risk_score,
            "verdict": entry.verdict,
            "reason": entry.reason
        }
        recomputed = compute_entry_hash(entry.prev_hash, data_dict)
        if recomputed != entry.entry_hash:
            issues.append(f"Tamper Detected in Log #{i} ({entry.id}): entry_hash does not match payload content!")
        
        expected_prev = entry.entry_hash

    return (len(issues) == 0, issues)
