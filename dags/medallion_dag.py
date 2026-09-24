import os
import sys
import re
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

# Ensure pipeline modules are importable
sys.path.append("/opt/airflow")
from data_generator.generate_data import run_data_generator
from pipeline.medallion import bronze_to_silver, silver_to_gold
from pipeline.s3_utils import get_s3_client

default_args = {
    "owner": "data_governance_team",
    "depends_on_past": False,
    "start_date": datetime(2026, 1, 1),
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
}

def task_generate_bronze():
    endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    print("Executing Task 1: Generate Bronze Data...")
    run_data_generator(endpoint)

def task_bronze_to_silver():
    endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    print("Executing Task 2: Bronze -> Silver Transformation & Masking...")
    bronze_to_silver(endpoint)

def task_silver_to_gold():
    endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    print("Executing Task 3: Silver -> Gold Aggregations...")
    silver_to_gold(endpoint)

def task_data_quality_checks():
    """
    Data Quality Assertion Task:
    Fails the DAG if unmasked PII (e.g. valid email syntax or raw name) leaks into Gold layer unmasked!
    """
    import io
    import pandas as pd

    endpoint = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")
    s3 = get_s3_client(endpoint)

    print("Executing Task 4: Data Quality & PII Leakage Assertions...")

    # Fetch Gold Customer Summary
    gold_obj = s3.get_object(Bucket="gold", Key="customer_summary.parquet")
    df_gold = pd.read_parquet(io.BytesIO(gold_obj["Body"].read()))

    # Assertion 1: Gold table must not be empty
    assert len(df_gold) > 0, "DATA QUALITY ERROR: Gold customer summary table is empty!"

    # Assertion 2: All entries in masked_name must start with 'TOK_'
    invalid_names = df_gold[~df_gold["masked_name"].str.startswith("TOK_")]
    assert len(invalid_names) == 0, f"PII LEAKAGE DETECTED! Found {len(invalid_names)} unmasked names in Gold layer: {invalid_names['masked_name'].tolist()}"

    # Assertion 3: No valid raw email format allowed in Gold masked_email column
    email_regex = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    leaked_emails = [e for e in df_gold["masked_email"] if email_regex.match(str(e))]
    assert len(leaked_emails) == 0, f"PII LEAKAGE DETECTED! Found raw emails in Gold layer: {leaked_emails}"

    print(f"ALL DATA QUALITY & COMPLIANCE CHECKS PASSED SUCCESSFULLY! Verified {len(df_gold)} records in Gold layer.")

with DAG(
    "banking_medallion_pipeline",
    default_args=default_args,
    description="Medallion Data Lake Pipeline (Bronze -> Silver -> Gold) with PII Masking and Quality Checks",
    schedule_interval="@daily",
    catchup=False,
) as dag:

    t1_bronze = PythonOperator(
        task_id="1_generate_bronze_data",
        python_callable=task_generate_bronze,
    )

    t2_silver = PythonOperator(
        task_id="2_transform_bronze_to_silver",
        python_callable=task_bronze_to_silver,
    )

    t3_gold = PythonOperator(
        task_id="3_transform_silver_to_gold",
        python_callable=task_silver_to_gold,
    )

    t4_dq_checks = PythonOperator(
        task_id="4_run_data_quality_checks",
        python_callable=task_data_quality_checks,
    )

    t1_bronze >> t2_silver >> t3_gold >> t4_dq_checks
