from app.models.schemas import (
    User, RoleEnum, SensitivityEnum, DeviceStatus, DeviceTrustLevel, Resource, PolicyRule
)

SEED_USERS = [
    User(
        id="USR-001",
        username="alice.finance",
        full_name="Alice Vance",
        email="alice.vance@enterprise-corp.internal",
        role=RoleEnum.FINANCE_OFFICER,
        department="Finance & Accounting",
        clearance_level=SensitivityEnum.HIGH,
        mfa_enabled=True,
        assigned_devices=["DEV-CORP-01", "DEV-BYOD-01"]
    ),
    User(
        id="USR-002",
        username="bob.devops",
        full_name="Bob Martinez",
        email="bob.martinez@enterprise-corp.internal",
        role=RoleEnum.DEVOPS_ENGINEER,
        department="Cloud Platform Ops",
        clearance_level=SensitivityEnum.CRITICAL,
        mfa_enabled=True,
        assigned_devices=["DEV-CORP-02"]
    ),
    User(
        id="USR-003",
        username="charlie.contractor",
        full_name="Charlie Chen (Vendor)",
        email="charlie.chen@thirdparty-consulting.com",
        role=RoleEnum.CONTRACTOR,
        department="External QA Vendor",
        clearance_level=SensitivityEnum.LOW,
        mfa_enabled=True,
        assigned_devices=["DEV-BYOD-01", "DEV-UNPATCH-01"]
    ),
    User(
        id="USR-004",
        username="diana.admin",
        full_name="Diana Prince",
        email="diana.prince@enterprise-corp.internal",
        role=RoleEnum.SECURITY_ADMIN,
        department="Information Security & GRC",
        clearance_level=SensitivityEnum.CRITICAL,
        mfa_enabled=True,
        assigned_devices=["DEV-CORP-01", "DEV-CORP-02"]
    ),
    User(
        id="USR-005",
        username="eve.attacker",
        full_name="Eve Rogue",
        email="eve.rogue@enterprise-corp.internal",
        role=RoleEnum.EMPLOYEE,
        department="Marketing & Growth",
        clearance_level=SensitivityEnum.LOW,
        mfa_enabled=False,
        failed_attempts=3,
        assigned_devices=["DEV-ROGUE-99", "DEV-UNPATCH-01"]
    ),
]

SEED_DEVICES = [
    DeviceStatus(
        device_id="DEV-CORP-01",
        name="Lenovo ThinkPad X1 Carbon (Corp-Fleet-04)",
        owner_username="alice.finance",
        os_name="Windows 11 Enterprise 23H2",
        os_version="10.0.22631",
        is_corporate_managed=True,
        is_firewall_enabled=True,
        is_antivirus_active=True,
        is_disk_encrypted=True,
        has_client_cert=True,
        trust_level=DeviceTrustLevel.COMPLIANT_CORPORATE,
        ip_address="10.14.22.105",
        location="New York HQ (Internal Trusted Subnet)",
        jailbroken_or_rooted=False
    ),
    DeviceStatus(
        device_id="DEV-CORP-02",
        name="Apple MacBook Pro 16\" M3 Max (DevOps-Secure)",
        owner_username="bob.devops",
        os_name="macOS Sonoma",
        os_version="14.5.0",
        is_corporate_managed=True,
        is_firewall_enabled=True,
        is_antivirus_active=True,
        is_disk_encrypted=True,
        has_client_cert=True,
        trust_level=DeviceTrustLevel.COMPLIANT_CORPORATE,
        ip_address="10.14.22.110",
        location="New York HQ (Production VPN Gateway)",
        jailbroken_or_rooted=False
    ),
    DeviceStatus(
        device_id="DEV-BYOD-01",
        name="Personal iPhone 15 Pro (BYOD Enrolled)",
        owner_username="alice.finance",
        os_name="iOS",
        os_version="17.5.1",
        is_corporate_managed=False,
        is_firewall_enabled=True,
        is_antivirus_active=False,
        is_disk_encrypted=True,
        has_client_cert=False,
        trust_level=DeviceTrustLevel.REGISTERED_BYOD,
        ip_address="172.56.21.90",
        location="Boston, MA (Home Teleworker ISP)",
        jailbroken_or_rooted=False
    ),
    DeviceStatus(
        device_id="DEV-UNPATCH-01",
        name="Legacy Dell Latitude E7470 (Unpatched)",
        owner_username="charlie.contractor",
        os_name="Windows 10 Pro (Outdated 1909)",
        os_version="10.0.18363",
        is_corporate_managed=False,
        is_firewall_enabled=False,
        is_antivirus_active=False,
        is_disk_encrypted=False,
        has_client_cert=False,
        trust_level=DeviceTrustLevel.UNPATCHED,
        ip_address="198.51.100.42",
        location="Chicago Public Coffee Wi-Fi (Untrusted)",
        jailbroken_or_rooted=False
    ),
    DeviceStatus(
        device_id="DEV-ROGUE-99",
        name="Rooted Kali Linux / Attack Container",
        owner_username="eve.attacker",
        os_name="Kali GNU/Linux Rolling",
        os_version="2024.2",
        is_corporate_managed=False,
        is_firewall_enabled=False,
        is_antivirus_active=False,
        is_disk_encrypted=False,
        has_client_cert=False,
        trust_level=DeviceTrustLevel.COMPROMISED,
        ip_address="185.220.101.5",
        location="Tor Exit Node / Anonymized Proxy",
        jailbroken_or_rooted=True
    ),
]

SEED_RESOURCES = [
    Resource(
        id="RES-FIN-01",
        name="Core Banking & Wire Transfer Ledger",
        description="High-security system executing company treasury disbursements, vendor wires, and payroll balances.",
        icon="DollarSign",
        category="Financial Core",
        sensitivity=SensitivityEnum.CRITICAL,
        endpoint_url="/api/internal/finance/ledger",
        allowed_roles=[RoleEnum.FINANCE_OFFICER],
        requires_corporate_device=True,
        requires_mfa=True,
        business_hours_only=True,
        max_risk_tolerance=30,
        sample_payload={
            "ledger_status": "ONLINE - SYNCHRONIZED",
            "active_disbursements": [
                {"txn_id": "TXN-9021", "recipient": "Acme Cloud Services", "amount": "$45,200.00", "status": "PENDING_RELEASE"},
                {"txn_id": "TXN-9022", "recipient": "Global Logistics Corp", "amount": "$12,450.00", "status": "APPROVED"}
            ],
            "balance_verified": "$4,892,100.45 USD",
            "audit_compliance_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        }
    ),
    Resource(
        id="RES-K8S-01",
        name="Production Kubernetes Control Plane",
        description="Direct cluster API console managing production ingress, secrets, microservices, and live databases.",
        icon="Server",
        category="Infrastructure",
        sensitivity=SensitivityEnum.CRITICAL,
        endpoint_url="/api/internal/devops/k8s-console",
        allowed_roles=[RoleEnum.DEVOPS_ENGINEER, RoleEnum.SECURITY_ADMIN],
        requires_corporate_device=True,
        requires_mfa=True,
        business_hours_only=False,
        max_risk_tolerance=35,
        sample_payload={
            "cluster_name": "prod-useast-primary-k8s",
            "nodes_healthy": "24 / 24",
            "pods_running": 312,
            "security_mesh": "mTLS Istio v1.22 Active",
            "active_deployments": [
                {"name": "payment-gateway-v3", "replicas": 8, "status": "Healthy"},
                {"name": "auth-service-v2", "replicas": 4, "status": "Healthy"},
                {"name": "data-pipeline-worker", "replicas": 12, "status": "Healthy"}
            ]
        }
    ),
    Resource(
        id="RES-HR-01",
        name="Employee Personnel & Compensation Records",
        description="Confidential HR system holding employee salary records, performance appraisals, and SSN/tax files.",
        icon="Users",
        category="Human Resources",
        sensitivity=SensitivityEnum.HIGH,
        endpoint_url="/api/internal/hr/personnel",
        allowed_roles=[RoleEnum.FINANCE_OFFICER, RoleEnum.SECURITY_ADMIN],
        requires_corporate_device=True,
        requires_mfa=True,
        business_hours_only=True,
        max_risk_tolerance=45,
        sample_payload={
            "department": "Global Human Capital",
            "total_headcount": 1420,
            "payroll_cycle": "Bi-Weekly (Oct 15, 2026)",
            "sensitive_records": [
                {"emp_id": "EMP-104", "name": "Vance, Alice", "title": "VP Finance", "salary_tier": "Tier-1 Exec"},
                {"emp_id": "EMP-208", "name": "Martinez, Bob", "title": "Lead Platform Engineer", "salary_tier": "Tier-2 Tech"}
            ]
        }
    ),
    Resource(
        id="RES-GIT-01",
        name="Enterprise Git Source Repositories",
        description="Internal source code repositories containing proprietary backend microservices and proprietary algorithms.",
        icon="GitBranch",
        category="Engineering",
        sensitivity=SensitivityEnum.MEDIUM,
        endpoint_url="/api/internal/engineering/git-repos",
        allowed_roles=[RoleEnum.DEVOPS_ENGINEER, RoleEnum.EMPLOYEE, RoleEnum.SECURITY_ADMIN],
        requires_corporate_device=False, # BYOD allowed if low risk
        requires_mfa=False,
        business_hours_only=False,
        max_risk_tolerance=65,
        sample_payload={
            "git_server": "git.internal.enterprise-corp.net",
            "repositories": [
                {"repo": "core-banking-backend", "branch": "main", "last_commit": "fix: add rate limiting to wire webhook"},
                {"repo": "cloud-infra-terraform", "branch": "prod", "last_commit": "feat: enforce zero trust network policies"},
                {"repo": "customer-mobile-app", "branch": "v4.1", "last_commit": "chore: bump dependencies"}
            ]
        }
    ),
    Resource(
        id="RES-WIKI-01",
        name="Enterprise Knowledgebase & Documentation",
        description="Company-wide confluence wiki containing engineering runbooks, brand guidelines, and onboarding decks.",
        icon="BookOpen",
        category="Collaboration",
        sensitivity=SensitivityEnum.LOW,
        endpoint_url="/api/internal/portal/wiki",
        allowed_roles=[RoleEnum.EMPLOYEE, RoleEnum.FINANCE_OFFICER, RoleEnum.DEVOPS_ENGINEER, RoleEnum.CONTRACTOR, RoleEnum.SECURITY_ADMIN],
        requires_corporate_device=False,
        requires_mfa=False,
        business_hours_only=False,
        max_risk_tolerance=85,
        sample_payload={
            "portal": "Enterprise Knowledge Space",
            "featured_articles": [
                {"title": "Zero Trust Security Architecture Standards (NIST SP 800-207)", "author": "Diana Prince"},
                {"title": "DevOps On-Call Runbook & Escalation Procedures", "author": "Bob Martinez"},
                {"title": "Corporate Expense & Reimbursement Policy", "author": "Alice Vance"}
            ]
        }
    ),
    Resource(
        id="RES-CUST-PII",
        name="GDPR Customer Privacy Vault",
        description="Restricted vault containing customer personal identifiable information, passports, and credit tokens.",
        icon="ShieldAlert",
        category="Compliance & Privacy",
        sensitivity=SensitivityEnum.CRITICAL,
        endpoint_url="/api/internal/security/pii-vault",
        allowed_roles=[RoleEnum.SECURITY_ADMIN], # Requires JIT elevation for others
        requires_corporate_device=True,
        requires_mfa=True,
        business_hours_only=True,
        max_risk_tolerance=25,
        sample_payload={
            "vault_classification": "TOP SECRET / STRICT PRIVACY",
            "records_encrypted": 2450000,
            "retention_policy": "7 Years Automated Purge",
            "audit_witness": "Zero-Trust PDP Verified Gateway #PEP-01"
        }
    )
]

SEED_POLICIES = [
    PolicyRule(
        id="POL-01",
        name="Enforce Corporate Device for Critical Resources",
        description="Critical resources (Banking Ledger, Production K8s, PII Vault) strictly require corporate-managed devices with disk encryption and client certificate.",
        resource_id=None, # Global
        min_device_trust=DeviceTrustLevel.COMPLIANT_CORPORATE,
        max_risk_allowed=40,
        allow_after_hours=False,
        require_mfa=True,
        enabled=True
    ),
    PolicyRule(
        id="POL-02",
        name="Least Privilege Role-Based Access Control (RBAC)",
        description="Verify user role matches the permitted role list defined in the resource access control matrix.",
        resource_id=None,
        max_risk_allowed=70,
        allow_after_hours=True,
        require_mfa=False,
        enabled=True
    ),
    PolicyRule(
        id="POL-03",
        name="Block Compromised and Unpatched Devices",
        description="Devices flagged with jailbreak, absent antivirus, or disabled firewalls are automatically blocked at the Policy Enforcement Point.",
        resource_id=None,
        min_device_trust=DeviceTrustLevel.REGISTERED_BYOD,
        max_risk_allowed=60,
        allow_after_hours=True,
        require_mfa=False,
        enabled=True
    ),
    PolicyRule(
        id="POL-04",
        name="Business Hours Restriction for Financial & PII Assets",
        description="Access to Financial and HR records is prohibited outside 08:00 - 18:00 unless an emergency Just-In-Time elevation ticket is active.",
        resource_id="RES-FIN-01",
        max_risk_allowed=30,
        allow_after_hours=False,
        require_mfa=True,
        enabled=True
    ),
    PolicyRule(
        id="POL-05",
        name="Dynamic Step-Up MFA Challenge on Medium/High Risk",
        description="Trigger cryptographic step-up MFA if contextual risk score exceeds 40 or if accessing from a non-corporate network.",
        resource_id=None,
        max_risk_allowed=50,
        allow_after_hours=True,
        require_mfa=True,
        enabled=True
    )
]
