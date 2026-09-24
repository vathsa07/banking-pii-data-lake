import os
import sys
import psycopg2
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from pipeline.s3_utils import get_s3_client

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        dbname=os.getenv("POSTGRES_DB", "postgres"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres")
    )

def get_user_role_info(username: str) -> dict:
    """
    Retrieves user and role permissions from Postgres governance database.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.username, u.role_name, r.can_view_pii, r.description
                FROM users u
                JOIN roles r ON u.role_name = r.role_name
                WHERE u.username = %s;
            """, (username,))
            row = cur.fetchone()
            if row:
                return {
                    "username": row[0],
                    "role_name": row[1],
                    "can_view_pii": row[2],
                    "role_description": row[3]
                }
            else:
                # Default guest / analyst fallback
                return {
                    "username": username,
                    "role_name": "analyst",
                    "can_view_pii": False,
                    "role_description": "Data Analyst (Masked Access)"
                }
    finally:
        conn.close()

def log_access(username: str, role_name: str, action: str, table_accessed: str, records_returned: int, pii_exposed: bool, client_info: str = "Streamlit UI"):
    """
    Logs every data access request into Postgres audit_logs table for banking compliance.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO audit_logs (username, role_name, action, table_accessed, records_returned, pii_exposed, client_info)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (username, role_name, action, table_accessed, records_returned, pii_exposed, client_info))
        conn.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}")
    finally:
        conn.close()

def get_pii_vault_map() -> dict:
    """
    Fetches token -> original_value dictionary from Postgres pii_vault table.
    Only accessible by privileged roles.
    """
    conn = get_db_connection()
    vault_map = {}
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT token, original_value FROM pii_vault;")
            rows = cur.fetchall()
            for token, orig in rows:
                vault_map[token] = orig
    finally:
        conn.close()
    return vault_map

def get_gold_customer_data(username: str, s3_endpoint=None) -> pd.DataFrame:
    """
    Serves Gold Customer Summary data.
    - If user role cannot view PII (analyst), returns tokenized values.
    - If user role can view PII (compliance_officer / admin), unmasks tokens using PII vault.
    - Automatically logs the access event in Postgres audit_logs.
    """
    role_info = get_user_role_info(username)
    role_name = role_info["role_name"]
    can_view_pii = role_info["can_view_pii"]

    s3 = get_s3_client(s3_endpoint)
    
    # Read Gold Customer Summary from S3
    try:
        gold_obj = s3.get_object(Bucket="gold", Key="customer_summary.parquet")
        df = pd.read_parquet(pd.io.common.BytesIO(gold_obj["Body"].read()))
    except Exception as e:
        # Fallback to local powerbi_export if S3 fetch fails
        export_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "powerbi_export", "customer_summary.parquet"))
        if os.path.exists(export_path):
            df = pd.read_parquet(export_path)
        else:
            raise RuntimeError(f"Gold customer summary not found: {e}")

    if can_view_pii:
        # Unmask PII tokens using PII Vault map
        vault_map = get_pii_vault_map()
        df["unmasked_name"] = df["masked_name"].map(lambda x: vault_map.get(x, x))
        df["unmasked_email"] = df["masked_email"].map(lambda x: vault_map.get(x, x))
        # Re-order columns for clarity
        cols = ["customer_id", "unmasked_name", "unmasked_email", "state", "risk_segment", "credit_score", "total_balance", "total_accounts", "total_transactions", "total_spent"]
        df_result = df[cols]
    else:
        # Serve masked dataset
        df_result = df.copy()

    # Record Compliance Audit Log
    log_access(
        username=username,
        role_name=role_name,
        action="READ_GOLD_CUSTOMERS",
        table_accessed="gold.customer_summary",
        records_returned=len(df_result),
        pii_exposed=can_view_pii
    )

    return df_result

def fetch_audit_logs(limit: int = 100) -> pd.DataFrame:
    """
    Fetches recent audit log entries from Postgres database.
    """
    conn = get_db_connection()
    try:
        query = """
            SELECT log_id, timestamp, username, role_name, action, table_accessed, records_returned, pii_exposed, client_info
            FROM audit_logs
            ORDER BY timestamp DESC
            LIMIT %s;
        """
        df = pd.read_sql(query, conn, params=(limit,))
        return df
    finally:
        conn.close()
