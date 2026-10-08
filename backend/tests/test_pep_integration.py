import pytest
from app.models.schemas import AccessRequest, VerdictEnum
from app.engine.pdp import evaluate_access_request
from app.engine.pep import enforce_gateway_access

def test_full_pdp_to_pep_pipeline():
    # Step 1: PDP request
    req = AccessRequest(
        username="bob.devops",
        device_id="DEV-CORP-02",
        resource_id="RES-K8S-01",
        current_time="11:00",
        mfa_code="123456"
    )
    decision = evaluate_access_request(req)
    assert decision.verdict == VerdictEnum.ALLOW
    token = decision.gateway_token
    assert token is not None

    # Step 2: PEP gateway verification & proxy
    result = enforce_gateway_access(
        resource_id="RES-K8S-01",
        gateway_token=token,
        current_device_id="DEV-CORP-02"
    )
    assert result["status"] == "AUTHORIZED"
    assert "protected_data" in result
    assert result["resource"]["id"] == "RES-K8S-01"

def test_pep_denies_missing_token():
    with pytest.raises(PermissionError, match="Missing Zero Trust Gateway Token"):
        enforce_gateway_access(
            resource_id="RES-K8S-01",
            gateway_token=None,
            current_device_id="DEV-CORP-02"
        )
