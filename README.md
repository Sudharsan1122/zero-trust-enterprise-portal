# Zero-Trust Enterprise Access Portal (NIST SP 800-207)
**Software Security Engineering (SSE) Platform — Project 24**

An enterprise-grade, simplified **Zero Trust Architecture (ZTA)** platform that continuously evaluates subject identity, endpoint posture, environmental context, and dynamic risk before granting access to internal applications.

---

## 🏛️ System Architecture Overview

Built strictly upon the **NIST SP 800-207 Zero Trust Architecture** standard:

```
+-----------------------------------------------------------------------------------------+
|                                    CONTROL PLANE                                        |
|  +-----------------------------------------------------------------------------------+  |
|  |                           Policy Decision Point (PDP)                             |  |
|  |  * Subject Identity Store (RBAC/ABAC)    * Dynamic Risk Scoring Engine            |  |
|  |  * Device Posture & Health Evaluator     * Just-In-Time (JIT) Elevation Service   |  |
|  |  * Policy Rules & Access Control Matrix  * Cryptographically Linked SIEM Logger   |  |
|  +-----------------------------------------------------------------------------------+  |
+-------------------------------------------|---------------------------------------------+
                                            | Decision / Mint Token
                                            v
+-----------------------------------------------------------------------------------------+
|                                     DATA PLANE                                          |
|                                                                                         |
|   [ Subject Context ]                                                                   |
|   * Alice / Bob / Charlie / Diana / Eve                                                 |
|   * Corp Laptop vs Unpatched PC vs Rogue                                                |
|   * Time: Business vs After-Hours                                                       |
|   * Network Subnet / Location                                                           |
|                 |                                                                       |
|                 v (Access Request)                                                      |
|   +---------------------------------------+                                             |
|   |   Policy Enforcement Point (PEP)      |                                             |
|   |   * Ingress Reverse Proxy / Gateway   |                                             |
|   |   * Cryptographic Token Verification  |                                             |
|   |   * Anti-Replay & Device Binding      |                                             |
|   +---------------------------------------+                                             |
|                 |                                                                       |
|                 | (Secure Proxied Payload upon ALLOW)                                   |
|                 v                                                                       |
|   +---------------------------------------------------------------------------------+   |
|   |              Microsegmented Protected Enterprise Resources                      |   |
|   |  * Core Banking Ledger (Critical)        * Production K8s Cluster (Critical)    |   |
|   |  * HR Personnel Records (High)           * Enterprise Git Codebase (Medium)     |   |
|   |  * Internal Wiki (Low)                   * GDPR Customer PII Vault (Critical)   |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 📋 Evaluation Signals (As per Project Specification)

Every incoming access request is evaluated across **6 real-time signals**:
1. **User Identity**: Subject credentials, account status, historical anomalies, failed login counts.
2. **Role**: Role-Based (RBAC) and Attribute-Based Access Control (ABAC) clearances (`EMPLOYEE`, `FINANCE_OFFICER`, `DEVOPS_ENGINEER`, `CONTRACTOR`, `SECURITY_ADMIN`).
3. **Device Status**: Health verification covering EDR/Antivirus, Host Firewall, Full Disk Encryption (BitLocker/FileVault), Corporate MDM Enrollment, Mutual TLS Client Certificate, and Root/Jailbreak detection.
4. **Requested Resource**: Classification sensitivity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), allowed roles, corporate-only hardware mandates, and risk tolerance thresholds.
5. **Access Time**: Business hours (08:00 - 18:00) vs. After-Hours (18:01 - 07:59). Off-hours access applies an automatic dynamic risk penalty or requires emergency JIT elevation.
6. **Risk Level**: Composite risk score (0 to 100) dynamically calculated across network locality (Tor/Public Wi-Fi/LAN), endpoint health, failed attempts, and time-of-day.

---

## 🛡️ Resolution of the 7 Security Challenges

| Security Challenge | Implementation in Portal |
| :--- | :--- |
| **1. Authentication** | Identity directory validation + conditional Multi-Factor Authentication (TOTP 6-digit challenge) for elevated risk or sensitive assets. |
| **2. Authorization** | Fine-grained ABAC + RBAC matrix matching user department, clearance tier, and target resource classification. |
| **3. Least Privilege** | Default-deny posture + Zero Standing Privileges (ZSP) via Just-In-Time (JIT) elevation (15-60 min time-bounded access with business justifications). |
| **4. Policy Enforcement** | Strict decoupling between **Policy Decision Point (PDP)** and **Policy Enforcement Point (PEP)** gateway gatekeeper. |
| **5. Privilege Escalation** | Short-lived JWT tokens cryptographically bound to the client's `device_id`. Replay attacks on unauthorized hardware are blocked. |
| **6. Trust Boundaries** | Microsegmentation: backend services are never directly reachable; only accessed through PEP reverse-proxy upon presenting a valid gateway token. |
| **7. Access Logging** | Blockchain-style cryptographic hash chaining (SHA-256 `prev_hash` linking) ensuring complete tamper-evidence in SIEM. |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.13 tested)
- **Node.js 18+** & **npm**

### 1-Click Launch (Windows)
Double-click:
```powershell
.\run_portal.bat
# or in PowerShell:
.\run_portal.ps1
```

Both servers will launch automatically:
- **Web UI Portal**: [http://localhost:5173](http://localhost:5173)
- **FastAPI REST API & Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

### Manual Launch

#### 1. Backend (FastAPI)
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

#### 2. Frontend (React + Vite + Tailwind)
```powershell
cd frontend
npm run dev
```

---

## 🧪 Demonstration & Grading Walkthrough

Follow these steps to demonstrate every requirement:

### Demo Scenario 1: Legitimate Authorized Access (Alice Vance)
1. Select **Alice Vance** (`FINANCE_OFFICER`) and **Lenovo ThinkPad** (`COMPLIANT_CORPORATE`).
2. Target **Core Banking Ledger** (`CRITICAL`).
3. Click **Evaluate Access Request via PDP**.
4. **Result**: Step-Up MFA Challenge is invoked due to high asset sensitivity.
5. Click **⚡ Auto-fill Master Code (123456)** and click **Verify & Re-evaluate**.
6. **Verdict**: `ALLOW`! Click **Access Resource via PEP Gateway** to view the decrypted financial disbursements payload proxied through the PEP.

### Demo Scenario 2: Compromised Device Interception (Eve Rogue / Kali)
1. Select **Eve Rogue** (`EMPLOYEE`) and **Rooted Kali Linux** (`COMPROMISED`).
2. Target **Production Kubernetes Control Plane**.
3. Click **Evaluate Access Request**.
4. **Verdict**: Hard `DENY`! The PDP immediately catches the rooted sandbox, Tor origin IP, and role mismatch.

### Demo Scenario 3: Device Posture Remediation (Charlie Contractor)
1. Navigate to the **Device Posture** tab.
2. Select **Legacy Dell Latitude** (Unpatched, score: 25/100).
3. Click the interactive toggles to enable **Endpoint EDR / AV**, **Host Firewall**, and **Disk Encryption**.
4. Watch the device health score immediately jump from 25 to 85/100 (`REGISTERED_BYOD`).

### Demo Scenario 4: Just-In-Time (JIT) Privilege Elevation (Bob Martinez)
1. Bob (`DEVOPS_ENGINEER`) normally does not have clearance for **GDPR Customer PII Vault**.
2. Go to **JIT Elevation** tab.
3. Submit a ticket for Bob with justification: *"Emergency incident hotfix #INC-901"*.
4. Switch to Diana Prince (Admin view) and click **Approve Elevation**.
5. Return to the Launcher; Bob now bypasses the privilege barrier under a 15-minute countdown window!

### Demo Scenario 5: Cyber-Attack Simulation & Tamper-Evident SIEM
1. Open the **SIEM & SOC** tab.
2. Under the **Attack Simulation Lab**, test:
   - **Credential Stuffing**: Spikes failed attempts and elevates user risk score.
   - **Tor Ingress**: Tests perimeter trust boundary blocking.
   - **Session Hijack / Replay**: Demonstrates device-binding rejection.
   - **Audit Log Tamper Test**: Intentionally mutates a log record.
3. Click **Verify Cryptographic Integrity**: The SIEM instantly flags `ALERT: Audit tampering detected!` showing the exact block index where the hash chain was broken.
4. Click **Reset Baseline** in the header to cleanly restore the environment anytime.
