import time
import jwt
import uuid
import hmac
import hashlib
from typing import Optional, Dict, Any
from app.config import SECRET_KEY, ALGORITHM

def create_gateway_token(
    username: str,
    role: str,
    resource_id: str,
    device_id: str,
    risk_score: int,
    expires_in_minutes: int = 15
) -> str:
    """
    Creates a cryptographically signed PEP gateway access token bound to the specific
    user, device, and resource. Zero Trust requires device-binding and short lifetimes.
    """
    now = int(time.time())
    payload = {
        "iss": "zero-trust-pep-gateway",
        "sub": username,
        "role": role,
        "aud": resource_id,
        "device_id": device_id,
        "risk_score": risk_score,
        "iat": now,
        "exp": now + (expires_in_minutes * 60),
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_gateway_token(token: str, expected_resource_id: str, current_device_id: str) -> Dict[str, Any]:
    """
    Verifies token cryptographic signature, expiration, target resource audience,
    and checks device-binding to prevent token theft and session replay attacks.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience=expected_resource_id)
    except jwt.ExpiredSignatureError:
        raise ValueError("Gateway Token has expired. Zero Trust requires re-authentication.")
    except jwt.InvalidAudienceError:
        raise ValueError("Privilege Escalation Attempt: Token was not issued for this resource boundary.")
    except jwt.PyJWTError as e:
        raise ValueError(f"Cryptographic Signature Verification Failed: {str(e)}")

    # Trust boundary & device-binding check
    if payload.get("device_id") != current_device_id:
        raise ValueError(
            f"Device Hijack Detected: Token bound to device '{payload.get('device_id')}', "
            f"but accessed from '{current_device_id}'."
        )

    return payload

def verify_mfa_code(user_secret: str, code: str) -> bool:
    """
    Simulates TOTP MFA verification. Accepts standard test codes or fixed master code.
    Master demo code '123456' is always accepted for seamless interactive testing.
    """
    if not code:
        return False
    clean_code = code.strip()
    if clean_code in ["123456", "000000"]:
        return True
    
    # Calculate pseudo-TOTP from secret and current 30s window
    window = int(time.time() // 30)
    for w in [window, window - 1, window + 1]:
        h = hmac.new(user_secret.encode(), str(w).encode(), hashlib.sha1).hexdigest()
        generated_code = str(int(h, 16) % 1000000).zfill(6)
        if clean_code == generated_code:
            return True
    return False
