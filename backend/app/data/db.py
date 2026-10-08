import copy
from typing import Dict, List, Optional
from datetime import datetime, timezone
from app.models.schemas import (
    User, DeviceStatus, Resource, PolicyRule, AuditLogEntry, JITRequest
)
from app.data.seed_data import SEED_USERS, SEED_DEVICES, SEED_RESOURCES, SEED_POLICIES

class Database:
    def __init__(self):
        self.reset()

    def reset(self):
        self.users: Dict[str, User] = {u.username: copy.deepcopy(u) for u in SEED_USERS}
        self.devices: Dict[str, DeviceStatus] = {d.device_id: copy.deepcopy(d) for d in SEED_DEVICES}
        self.resources: Dict[str, Resource] = {r.id: copy.deepcopy(r) for r in SEED_RESOURCES}
        self.policies: Dict[str, PolicyRule] = {p.id: copy.deepcopy(p) for p in SEED_POLICIES}
        self.jit_requests: Dict[str, JITRequest] = {}
        self.audit_logs: List[AuditLogEntry] = []
        self.last_log_hash: str = "0000000000000000000000000000000000000000000000000000000000000000"

    def get_user(self, username: str) -> Optional[User]:
        return self.users.get(username)

    def get_device(self, device_id: str) -> Optional[DeviceStatus]:
        return self.devices.get(device_id)

    def get_resource(self, resource_id: str) -> Optional[Resource]:
        return self.resources.get(resource_id)

    def list_users(self) -> List[User]:
        return list(self.users.values())

    def list_devices(self) -> List[DeviceStatus]:
        return list(self.devices.values())

    def list_resources(self) -> List[Resource]:
        return list(self.resources.values())

    def list_policies(self) -> List[PolicyRule]:
        return list(self.policies.values())

    def list_jit_requests(self) -> List[JITRequest]:
        return list(self.jit_requests.values())

    def add_jit_request(self, req: JITRequest):
        self.jit_requests[req.id] = req

    def get_jit_request(self, req_id: str) -> Optional[JITRequest]:
        return self.jit_requests.get(req_id)

    def update_device(self, device_id: str, updates: dict) -> Optional[DeviceStatus]:
        if device_id in self.devices:
            dev = self.devices[device_id]
            for k, v in updates.items():
                if hasattr(dev, k):
                    setattr(dev, k, v)
            return dev
        return None

db = Database()
