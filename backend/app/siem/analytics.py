from typing import Dict, Any, List
from collections import Counter
from app.data.db import db
from app.models.schemas import VerdictEnum
from app.siem.logger import verify_audit_integrity

def get_siem_dashboard_metrics() -> Dict[str, Any]:
    logs = db.audit_logs
    total = len(logs)
    
    verdicts = Counter([l.verdict for l in logs])
    challenges = Counter([l.security_challenge for l in logs])
    risks = [l.risk_score for l in logs]
    
    avg_risk = round(sum(risks) / total, 1) if total > 0 else 0
    high_risk_count = sum(1 for r in risks if r >= 60)
    
    # Calculate threat level
    if high_risk_count >= 5 or verdicts.get("DENY", 0) >= 6:
        threat_level = "ELEVATED"
    elif high_risk_count >= 10:
        threat_level = "CRITICAL"
    else:
        threat_level = "NORMAL"

    chain_valid, issues = verify_audit_integrity()

    return {
        "summary": {
            "total_evaluations": total,
            "allowed_count": verdicts.get("ALLOW", 0),
            "denied_count": verdicts.get("DENY", 0),
            "mfa_challenged_count": verdicts.get("MFA_REQUIRED", 0),
            "jit_required_count": verdicts.get("JIT_REQUIRED", 0),
            "remediation_count": verdicts.get("REMEDIATION_REQUIRED", 0),
            "average_risk_score": avg_risk,
            "threat_level": threat_level
        },
        "breakdown_by_security_challenge": dict(challenges),
        "audit_chain_status": {
            "is_immutable_chain_valid": chain_valid,
            "total_blocks": total,
            "tamper_issues": issues
        },
        "recent_alerts": [
            {
                "id": l.id,
                "timestamp": l.timestamp,
                "username": l.username,
                "resource": l.resource_id,
                "risk_score": l.risk_score,
                "verdict": l.verdict,
                "reason": l.reason,
                "challenge": l.security_challenge
            }
            for l in logs[:15]
        ]
    }
