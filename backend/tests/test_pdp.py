import pytest
from app.models.schemas import AccessRequest, VerdictEnum
from app.engine.pdp import evaluate_access_request
from app.data.db import db

def test_pdp_allows_corporate_device_legitimate_user():
    req = AccessRequest(
        username="alice.finance",
        device_id="DEV-CORP-01",
        resource_id="RES-FIN-01",
        current_time="10:30",
        mfa_code="123456"
    )
    decision = evaluate_access_request(req)
    assert decision.verdict == VerdictEnum.ALLOW
    assert decision.risk_score <= 30
    assert decision.gateway_token is not None

def test_pdp_blocks_compromised_endpoint():
    req = AccessRequest(
        username="eve.attacker",
        device_id="DEV-ROGUE-99",
        resource_id="RES-K8S-01",
        current_time="10:30"
    )
    decision = evaluate_access_request(req)
    assert decision.verdict == VerdictEnum.DENY
    assert decision.risk_score >= 80

def test_pdp_enforces_stepup_mfa_for_sensitive_resource():
    req = AccessRequest(
        username="alice.finance",
        device_id="DEV-CORP-01",
        resource_id="RES-FIN-01",
        current_time="10:30",
        mfa_code=None
    )
    decision = evaluate_access_request(req)
    assert decision.verdict == VerdictEnum.MFA_REQUIRED
    assert decision.gateway_token is None

def test_pdp_least_privilege_requires_jit_for_restricted_asset():
    req = AccessRequest(
        username="bob.devops",
        device_id="DEV-CORP-02",
        resource_id="RES-CUST-PII",
        current_time="10:30"
    )
    decision = evaluate_access_request(req)
    assert decision.verdict == VerdictEnum.JIT_REQUIRED
