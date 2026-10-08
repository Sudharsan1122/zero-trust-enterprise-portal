import pytest
from app.models.schemas import AccessRequest
from app.engine.pdp import evaluate_access_request

FUZZ_PAYLOADS = [
    # 1. Extreme Length / Buffer Overflow Simulation
    "A" * 5000,
    # 2. Null Byte Injection
    "user\x00admin",
    # 3. Path Traversal & Shell Metacharacters
    "../../../etc/shadow; reboot",
    "$(whoami)`touch /tmp/pwned`",
    # 4. SQL / Command Injection Strings
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    # 5. Unicode Boundary & Non-ASCII
    "\uFFFF\uFEFF\u0000\u202E",
    # 6. Malformed Temporal Strings
    "99:99",
    "-12:00",
    "INVALID_DATE_TIME_STRING_9999",
]

def test_input_boundary_fuzzing_resilience():
    """
    Fuzzing Test targeting PDP input boundaries.
    The system MUST handle all malformed, adversarial, and overflow inputs safely
    without unhandled crashes (Zero Trust Fail-Secure Principle).
    """
    passed_fuzz_trials = 0

    for payload in FUZZ_PAYLOADS:
        # Fuzz username
        req1 = AccessRequest(
            username=payload,
            device_id="DEV-CORP-01",
            resource_id="RES-FIN-01"
        )
        res1 = evaluate_access_request(req1)
        assert res1 is not None
        assert res1.verdict.value in ["DENY", "MFA_REQUIRED", "REMEDIATION_REQUIRED", "JIT_REQUIRED"]
        passed_fuzz_trials += 1

        # Fuzz resource_id
        req2 = AccessRequest(
            username="alice.finance",
            device_id="DEV-CORP-01",
            resource_id=payload
        )
        res2 = evaluate_access_request(req2)
        assert res2 is not None
        passed_fuzz_trials += 1

        # Fuzz current_time
        req3 = AccessRequest(
            username="alice.finance",
            device_id="DEV-CORP-01",
            resource_id="RES-FIN-01",
            current_time=payload
        )
        res3 = evaluate_access_request(req3)
        assert res3 is not None
        passed_fuzz_trials += 1

    assert passed_fuzz_trials == len(FUZZ_PAYLOADS) * 3
