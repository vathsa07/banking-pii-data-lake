import os
import sys
import pandas as pd
import json
from fastapi import APIRouter, Depends, HTTPException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.auth import decode_token, require_roles
from governance.access_control import get_gold_customer_data
from pipeline.s3_utils import get_s3_client

router = APIRouter(prefix="/data", tags=["Data Lake"])

@router.get("/gold")
def get_gold_data(payload: dict = Depends(decode_token)):
    """
    Returns Gold Customer Summary.
    - Analyst: PII fields masked/tokenized.
    - Compliance Officer / Admin: PII fields unmasked.
    - Writes access attempt to PostgreSQL audit log table.
    """
    username = payload.get("sub")
    s3_endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    
    try:
        df = get_gold_customer_data(username, s3_endpoint=s3_endpoint)
        records = df.to_dict(orient="records")
        return {
            "status": "success",
            "role": payload.get("role"),
            "record_count": len(records),
            "data": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Gold data: {str(e)}")

@router.get("/transaction-summary")
def get_transaction_summary(payload: dict = Depends(decode_token)):
    s3_endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    s3 = get_s3_client(s3_endpoint)
    try:
        gold_obj = s3.get_object(Bucket="gold", Key="transaction_summary.parquet")
        df = pd.read_parquet(pd.io.common.BytesIO(gold_obj["Body"].read()))
        return {"status": "success", "data": df.to_dict(orient="records")}
    except Exception:
        export_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../powerbi_export/transaction_summary.parquet"))
        if os.path.exists(export_path):
            df = pd.read_parquet(export_path)
            return {"status": "success", "data": df.to_dict(orient="records")}
        return {"status": "success", "data": []}

@router.get("/risk-summary")
def get_risk_summary(payload: dict = Depends(decode_token)):
    s3_endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    s3 = get_s3_client(s3_endpoint)
    try:
        gold_obj = s3.get_object(Bucket="gold", Key="risk_segment_summary.parquet")
        df = pd.read_parquet(pd.io.common.BytesIO(gold_obj["Body"].read()))
        return {"status": "success", "data": df.to_dict(orient="records")}
    except Exception:
        export_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../powerbi_export/risk_segment_summary.parquet"))
        if os.path.exists(export_path):
            df = pd.read_parquet(export_path)
            return {"status": "success", "data": df.to_dict(orient="records")}
        return {"status": "success", "data": []}
