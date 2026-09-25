import os
import sys

from fastapi import APIRouter, Depends, HTTPException

from backend.auth import require_roles
from governance.access_control import fetch_audit_logs

sys.path.append(os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")))

router = APIRouter(prefix="/audit-log", tags=["Compliance Audit Logs"])


@router.get("")
def get_audit_logs(
    limit: int = 100,
    payload: dict = Depends(require_roles(["compliance_officer", "admin"])),
):
    """
    Returns compliance audit log entries. Restricted to compliance_officer and admin roles.
    """
    try:
        df = fetch_audit_logs(limit=limit)
        # Convert timestamp to ISO string
        if "timestamp" in df.columns:
            df["timestamp"] = df["timestamp"].astype(str)
        records = df.to_dict(orient="records")
        return {"status": "success", "count": len(records), "logs": records}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch audit logs: {e!s}"
        )
