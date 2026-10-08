from typing import Tuple, List, Dict, Any
from app.models.schemas import DeviceStatus, DeviceTrustLevel

def evaluate_device_posture(device: DeviceStatus) -> Tuple[DeviceTrustLevel, int, List[str]]:
    """
    Evaluates endpoint health and security posture.
    Returns: (DeviceTrustLevel, posture_score 0-100, list of remediation recommendations)
    """
    remediation_steps = []
    score = 100

    # Critical compromise check
    if device.jailbroken_or_rooted:
        score = 0
        remediation_steps.append("Device is rooted or jailbroken. Security sandbox compromised.")
        return DeviceTrustLevel.COMPROMISED, score, remediation_steps

    if "tor" in device.location.lower() or "185.220" in device.ip_address:
        score -= 50
        remediation_steps.append("Origin IP originates from known Tor anonymity network or malicious proxy.")

    # Antivirus check
    if not device.is_antivirus_active:
        score -= 25
        remediation_steps.append("Endpoint Antivirus / EDR agent is inactive or disabled.")

    # Firewall check
    if not device.is_firewall_enabled:
        score -= 20
        remediation_steps.append("Host firewall is disabled. Enable host-based packet filtering.")

    # Disk Encryption check
    if not device.is_disk_encrypted:
        score -= 20
        remediation_steps.append("Full disk encryption (BitLocker/FileVault) is missing or unverified.")

    # Client Certificate
    if not device.has_client_cert:
        score -= 15
        remediation_steps.append("Mutual TLS Corporate Device Identity Certificate is absent.")

    # Corporate MDM management
    if not device.is_corporate_managed:
        score -= 15
        remediation_steps.append("Device is not registered in corporate MDM (BYOD posture).")

    # Determine trust level
    if score >= 85 and device.is_corporate_managed:
        trust_level = DeviceTrustLevel.COMPLIANT_CORPORATE
    elif score >= 50:
        trust_level = DeviceTrustLevel.REGISTERED_BYOD
    elif score >= 20:
        trust_level = DeviceTrustLevel.UNPATCHED
    else:
        trust_level = DeviceTrustLevel.COMPROMISED

    score = max(0, min(100, score))
    return trust_level, score, remediation_steps
