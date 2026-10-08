import pytest
from app.security.auth import create_gateway_token, verify_gateway_token, verify_mfa_code

def test_token_creation_and_valid_verification():
    token = create_gateway_token(
        username="alice.finance",
        role="FINANCE_OFFICER",
        resource_id="RES-FIN-01",
        device_id="DEV-CORP-01",
        risk_score=15,
        expires_in_minutes=15
    )
    assert token is not None
    claims = verify_gateway_token(token, expected_resource_id="RES-FIN-01", current_device_id="DEV-CORP-01")
    assert claims["sub"] == "alice.finance"
    assert claims["aud"] == "RES-FIN-01"
    assert claims["device_id"] == "DEV-CORP-01"

def test_token_replay_rejected_on_different_device():
    token = create_gateway_token(
        username="alice.finance",
        role="FINANCE_OFFICER",
        resource_id="RES-FIN-01",
        device_id="DEV-CORP-01",
        risk_score=15
    )
    with pytest.raises(ValueError, match="Device Hijack Detected"):
        verify_gateway_token(token, expected_resource_id="RES-FIN-01", current_device_id="DEV-ROGUE-99")

def test_token_resource_boundary_violation():
    token = create_gateway_token(
        username="alice.finance",
        role="FINANCE_OFFICER",
        resource_id="RES-FIN-01",
        device_id="DEV-CORP-01",
        risk_score=15
    )
    with pytest.raises(ValueError, match="Privilege Escalation Attempt"):
        verify_gateway_token(token, expected_resource_id="RES-K8S-01", current_device_id="DEV-CORP-01")

def test_mfa_code_verification():
    assert verify_mfa_code("JBSWY3DPEHPK3PXP", "123456") is True
    assert verify_mfa_code("JBSWY3DPEHPK3PXP", "999999") is False
