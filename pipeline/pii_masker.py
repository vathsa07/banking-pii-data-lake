import os
import re
import hmac
import hashlib
import psycopg2

HMAC_SECRET = os.getenv("HMAC_SECRET_KEY", "banking_super_secret_pii_key_2026").encode("utf-8")

# Regex patterns for PII detection
PII_PATTERNS = {
    "SSN": r"^\d{3}-\d{2}-\d{4}$",
    "EMAIL": r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
    "PHONE": r"^\+?[0-9\s\-\(\)\.]{7,20}$",
    "ACCOUNT_NUM": r"^[A-Z0-9]{10,20}$"
}

def generate_token(value: str, pii_type: str) -> str:
    """
    Generates a deterministic HMAC-SHA256 token for a given PII value.
    """
    if not value:
        return value
    h = hmac.new(HMAC_SECRET, str(value).encode("utf-8"), hashlib.sha256)
    digest = h.hexdigest()[:16].upper()
    return f"TOK_{pii_type}_{digest}"

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        dbname=os.getenv("POSTGRES_DB", "postgres"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres")
    )

def store_pii_tokens_in_vault(token_mapping_list):
    """
    Saves (token, pii_type, original_value) entries into Postgres pii_vault table.
    token_mapping_list is a list of tuples: (token, pii_type, original_value)
    """
    if not token_mapping_list:
        return
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO pii_vault (token, pii_type, original_value)
                VALUES (%s, %s, %s)
                ON CONFLICT (token) DO NOTHING;
                """,
                token_mapping_list
            )
        conn.commit()
    finally:
        conn.close()

def mask_customer_record(record: dict) -> tuple:
    """
    Masks PII fields in a customer record and returns (masked_record, pii_vault_entries).
    PII fields: name, ssn, email, phone_number, street_address
    """
    masked = record.copy()
    vault_entries = []

    pii_fields = {
        "name": "NAME",
        "ssn": "SSN",
        "email": "EMAIL",
        "phone_number": "PHONE",
        "street_address": "ADDRESS"
    }

    for field, pii_type in pii_fields.items():
        val = record.get(field)
        if val:
            token = generate_token(val, pii_type)
            masked[field] = token
            vault_entries.append((token, pii_type, str(val)))

    return masked, vault_entries

def mask_account_record(record: dict) -> tuple:
    """
    Masks account_number in an account record.
    """
    masked = record.copy()
    vault_entries = []
    
    acc_num = record.get("account_number")
    if acc_num:
        token = generate_token(acc_num, "ACC_NUM")
        masked["account_number"] = token
        vault_entries.append((token, "ACC_NUM", str(acc_num)))

    return masked, vault_entries
