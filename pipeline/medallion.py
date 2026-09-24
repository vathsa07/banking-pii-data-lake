import os
import sys
import json
import io
import pandas as pd
import duckdb
import boto3

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from pipeline.s3_utils import get_s3_client, ensure_buckets_exist
from pipeline.pii_masker import mask_customer_record, mask_account_record, store_pii_tokens_in_vault

EXPORT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "powerbi_export"))

def bronze_to_silver(s3_endpoint=None):
    """
    Transforms raw JSON data from Bronze bucket to cleaned, PII-tokenized Parquet in Silver bucket.
    """
    print("--- Starting Bronze -> Silver Pipeline ---")
    s3 = get_s3_client(s3_endpoint)
    ensure_buckets_exist(s3_endpoint)

    # 1. Process Customers
    print("Processing Bronze Customers...")
    cust_obj = s3.get_object(Bucket="bronze", Key="raw/customers.json")
    raw_customers = json.loads(cust_obj["Body"].read().decode("utf-8"))

    masked_customers = []
    all_vault_entries = []

    for cust in raw_customers:
        masked, vault = mask_customer_record(cust)
        masked_customers.append(masked)
        all_vault_entries.extend(vault)

    # Store tokens in Postgres Vault
    store_pii_tokens_in_vault(all_vault_entries)

    # Convert to DataFrame & Parquet
    df_cust = pd.DataFrame(masked_customers)
    buffer_cust = io.BytesIO()
    df_cust.to_parquet(buffer_cust, index=False)
    buffer_cust.seek(0)

    s3.put_object(
        Bucket="silver",
        Key="customers.parquet",
        Body=buffer_cust.getvalue()
    )
    print(f"Silver Customers written: {len(df_cust)} records (PII tokenized).")

    # 2. Process Accounts
    print("Processing Bronze Accounts...")
    acc_obj = s3.get_object(Bucket="bronze", Key="raw/accounts.json")
    raw_accounts = json.loads(acc_obj["Body"].read().decode("utf-8"))

    masked_accounts = []
    acc_vault_entries = []

    for acc in raw_accounts:
        masked, vault = mask_account_record(acc)
        masked_accounts.append(masked)
        acc_vault_entries.extend(vault)

    store_pii_tokens_in_vault(acc_vault_entries)

    df_acc = pd.DataFrame(masked_accounts)
    buffer_acc = io.BytesIO()
    df_acc.to_parquet(buffer_acc, index=False)
    buffer_acc.seek(0)

    s3.put_object(
        Bucket="silver",
        Key="accounts.parquet",
        Body=buffer_acc.getvalue()
    )
    print(f"Silver Accounts written: {len(df_acc)} records.")

    # 3. Process Transactions
    print("Processing Bronze Transactions...")
    tx_obj = s3.get_object(Bucket="bronze", Key="raw/transactions.json")
    raw_tx = json.loads(tx_obj["Body"].read().decode("utf-8"))

    df_tx = pd.DataFrame(raw_tx)
    buffer_tx = io.BytesIO()
    df_tx.to_parquet(buffer_tx, index=False)
    buffer_tx.seek(0)

    s3.put_object(
        Bucket="silver",
        Key="transactions.parquet",
        Body=buffer_tx.getvalue()
    )
    print(f"Silver Transactions written: {len(df_tx)} records.")
    print("--- Bronze -> Silver Pipeline Completed ---")


def silver_to_gold(s3_endpoint=None):
    """
    Aggregates Silver Parquet tables into Gold business-ready analytics tables using DuckDB.
    Also exports gold tables to /powerbi_export directory.
    """
    print("--- Starting Silver -> Gold Pipeline ---")
    s3 = get_s3_client(s3_endpoint)
    os.makedirs(EXPORT_DIR, exist_ok=True)

    # Read Silver tables into DataFrames
    c_bytes = s3.get_object(Bucket="silver", Key="customers.parquet")["Body"].read()
    a_bytes = s3.get_object(Bucket="silver", Key="accounts.parquet")["Body"].read()
    t_bytes = s3.get_object(Bucket="silver", Key="transactions.parquet")["Body"].read()

    df_customers = pd.read_parquet(io.BytesIO(c_bytes))
    df_accounts = pd.read_parquet(io.BytesIO(a_bytes))
    df_transactions = pd.read_parquet(io.BytesIO(t_bytes))

    con = duckdb.connect(database=":memory:")
    con.register("silver_customers", df_customers)
    con.register("silver_accounts", df_accounts)
    con.register("silver_transactions", df_transactions)

    # 1. Customer Summary Table (Gold)
    print("Building Gold Customer Summary...")
    customer_summary_query = """
    SELECT 
        c.customer_id,
        c.name AS masked_name,
        c.email AS masked_email,
        c.state,
        c.risk_segment,
        c.credit_score,
        COALESCE(SUM(a.balance), 0) AS total_balance,
        COUNT(DISTINCT a.account_id) AS total_accounts,
        COUNT(DISTINCT t.transaction_id) AS total_transactions,
        COALESCE(SUM(t.amount), 0) AS total_spent
    FROM silver_customers c
    LEFT JOIN silver_accounts a ON c.customer_id = a.customer_id
    LEFT JOIN silver_transactions t ON c.customer_id = t.customer_id
    GROUP BY c.customer_id, c.name, c.email, c.state, c.risk_segment, c.credit_score
    """
    df_gold_cust = con.execute(customer_summary_query).df()

    # 2. Regional & Category Transaction Analytics Table (Gold)
    print("Building Gold Transaction Summary...")
    tx_summary_query = """
    SELECT 
        c.state AS region,
        t.transaction_type,
        t.merchant_category,
        COUNT(t.transaction_id) AS transaction_count,
        SUM(t.amount) AS total_volume,
        ROUND(AVG(t.amount), 2) AS avg_transaction_amount
    FROM silver_transactions t
    JOIN silver_customers c ON t.customer_id = c.customer_id
    GROUP BY c.state, t.transaction_type, t.merchant_category
    """
    df_gold_tx = con.execute(tx_summary_query).df()

    # 3. Risk Segment Aggregates Table (Gold)
    print("Building Gold Risk Segment Summary...")
    risk_summary_query = """
    SELECT 
        c.risk_segment,
        COUNT(DISTINCT c.customer_id) AS customer_count,
        ROUND(AVG(c.credit_score), 1) AS avg_credit_score,
        SUM(a.balance) AS total_segment_balance
    FROM silver_customers c
    LEFT JOIN silver_accounts a ON c.customer_id = a.customer_id
    GROUP BY c.risk_segment
    """
    df_gold_risk = con.execute(risk_summary_query).df()

    # Upload Gold tables to S3 & Export to Power BI folder
    gold_tables = {
        "customer_summary": df_gold_cust,
        "transaction_summary": df_gold_tx,
        "risk_segment_summary": df_gold_risk
    }

    for name, df in gold_tables.items():
        buf = io.BytesIO()
        df.to_parquet(buf, index=False)
        buf.seek(0)
        
        # S3 upload
        s3.put_object(
            Bucket="gold",
            Key=f"{name}.parquet",
            Body=buf.getvalue()
        )
        
        # Local Power BI export
        local_path = os.path.join(EXPORT_DIR, f"{name}.parquet")
        df.to_parquet(local_path, index=False)
        print(f"Gold table {name} saved to S3 (gold/{name}.parquet) and local ({local_path})")

    print("--- Silver -> Gold Pipeline Completed ---")

if __name__ == "__main__":
    endpoint = os.getenv("S3_ENDPOINT_URL", "http://localhost:5001")
    bronze_to_silver(endpoint)
    silver_to_gold(endpoint)
