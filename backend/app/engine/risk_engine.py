from datetime import datetime
from typing import List, Optional
from app.models.schemas import (
    User, DeviceStatus, Resource, RiskAssessment, RiskFactor, SensitivityEnum, DeviceTrustLevel
)

def evaluate_access_time(time_str: Optional[str] = None) -> bool:
    """
    Checks if access is within standard enterprise business hours (08:00 - 18:00).
    Returns True if within business hours, False if after-hours or weekend.
    """
    if time_str:
        try:
            # Expecting HH:MM or ISO
            if "T" in time_str:
                dt = datetime.fromisoformat(time_str)
                hour = dt.hour
                weekday = dt.weekday()
                if weekday >= 5: # Saturday or Sunday
                    return False
                return 8 <= hour < 18
            elif ":" in time_str:
                parts = time_str.split(":")
                hour = int(parts[0])
                return 8 <= hour < 18
        except Exception:
            pass

    # Default to current system time
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    return 8 <= now.hour < 18

def calculate_dynamic_risk(
    user: User,
    device: DeviceStatus,
    resource: Resource,
    access_time: Optional[str] = None,
    client_ip: Optional[str] = None
) -> RiskAssessment:
    factors: List[RiskFactor] = []
    total = 0

    # 1. Device Posture Risk
    if device.trust_level == DeviceTrustLevel.COMPROMISED:
        factors.append(RiskFactor(
            factor_name="Compromised Device Sandbox",
            score=75,
            severity="CRITICAL",
            description="Endpoint is rooted, compromised, or operating through an untrusted anonymizer."
        ))
        total += 75
    elif device.trust_level == DeviceTrustLevel.UNPATCHED:
        factors.append(RiskFactor(
            factor_name="Unpatched Vulnerable Endpoint",
            score=40,
            severity="HIGH",
            description="Operating system lacks security baselines, missing active antivirus or firewall."
        ))
        total += 40
    elif device.trust_level == DeviceTrustLevel.REGISTERED_BYOD:
        factors.append(RiskFactor(
            factor_name="BYOD Unmanaged Perimeter",
            score=15,
            severity="MEDIUM",
            description="Device is personal BYOD without corporate client identity certificate."
        ))
        total += 15

    # 2. Network & Location Risk
    effective_ip = client_ip or device.ip_address
    if "tor" in device.location.lower() or effective_ip.startswith("185.220"):
        factors.append(RiskFactor(
            factor_name="Anonymized Tor / Proxy Origin",
            score=45,
            severity="CRITICAL",
            description="Connection detected from a high-threat IP or anonymized proxy network."
        ))
        total += 45
    elif "public" in device.location.lower() or effective_ip.startswith("198.51"):
        factors.append(RiskFactor(
            factor_name="Untrusted Public Wi-Fi / External Network",
            score=20,
            severity="MEDIUM",
            description="Originating from an untrusted public Wi-Fi or coffee shop subnet."
        ))
        total += 20
    elif effective_ip.startswith("10."):
        # Corporate LAN - zero risk
        pass
    else:
        factors.append(RiskFactor(
            factor_name="Off-Premise Remote Telework Network",
            score=10,
            severity="LOW",
            description="Teleworker accessing through residential broadband."
        ))
        total += 10

    # 3. Access Time Anomaly
    is_business_hours = evaluate_access_time(access_time)
    if not is_business_hours:
        penalty = 25 if resource.sensitivity in [SensitivityEnum.HIGH, SensitivityEnum.CRITICAL] else 10
        factors.append(RiskFactor(
            factor_name="Temporal Anomaly (After-Hours Access)",
            score=penalty,
            severity="MEDIUM" if penalty == 25 else "LOW",
            description="Resource requested outside corporate business hours (08:00 - 18:00 Mon-Fri)."
        ))
        total += penalty

    # 4. User Identity & Anomaly History
    if user.failed_attempts > 0:
        penalty = min(35, user.failed_attempts * 12)
        factors.append(RiskFactor(
            factor_name="Recent Authentication Failures / Anomaly",
            score=penalty,
            severity="HIGH" if penalty >= 25 else "MEDIUM",
            description=f"Subject has recorded {user.failed_attempts} recent failed authentication attempts."
        ))
        total += penalty

    if user.role.value == "CONTRACTOR":
        factors.append(RiskFactor(
            factor_name="Third-Party Contractor Clearance",
            score=10,
            severity="LOW",
            description="External vendor credential subject to stricter zero-trust verification."
        ))
        total += 10

    # 5. Resource Sensitivity Elevation
    if resource.sensitivity == SensitivityEnum.CRITICAL:
        factors.append(RiskFactor(
            factor_name="Critical Enterprise Asset Ingress",
            score=15,
            severity="MEDIUM",
            description="Resource classification is CRITICAL; elevated security baseline enforced."
        ))
        total += 15
    elif resource.sensitivity == SensitivityEnum.HIGH:
        total += 5

    total_clamped = min(100, max(0, total))

    if total_clamped >= 75:
        risk_level = "CRITICAL"
    elif total_clamped >= 50:
        risk_level = "HIGH"
    elif total_clamped >= 25:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return RiskAssessment(
        total_score=total_clamped,
        risk_level=risk_level,
        factors=factors
    )
