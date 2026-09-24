import json
import os
import sys
import random
from datetime import datetime, timedelta
from faker import Faker
import boto3

# Add parent dir to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from pipeline.s3_utils import get_s3_client, ensure_buckets_exist

fake = Faker()
Faker.seed(42)
random.seed(42)

def generate_customers(count=100):
    customers = []
    risk_segments = ["Low Risk", "Medium Risk", "High Risk", "PEP (Politically Exposed)"]
    states = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"]

    for i in range(1, count + 1):
        c = {
            "customer_id": f"CUST_{i:05d}",
            "name": fake.name(),
            "ssn": fake.ssn(),
            "email": fake.email(),
            "phone_number": fake.phone_number(),
            "street_address": fake.street_address(),
            "city": fake.city(),
            "state": random.choice(states),
            "zip_code": fake.zipcode(),
            "credit_score": random.randint(580, 850),
            "risk_segment": random.choice(risk_segments),
            "created_at": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat()
        }
        customers.append(c)
    return customers

def generate_accounts(customers):
    accounts = []
    account_types = ["Checking", "Savings", "Money Market", "Investment"]
    
    acc_id = 1
    for cust in customers:
        # Each customer has 1-3 accounts
        num_accs = random.randint(1, 3)
        for _ in range(num_accs):
            acc = {
                "account_id": f"ACC_{acc_id:06d}",
                "customer_id": cust["customer_id"],
                "account_number": fake.iban()[:16],
                "account_type": random.choice(account_types),
                "balance": round(random.uniform(500.0, 75000.0), 2),
                "currency": "USD",
                "opened_date": (datetime.now() - timedelta(days=random.randint(10, 300))).isoformat(),
                "status": "ACTIVE"
            }
            accounts.append(acc)
            acc_id += 1
    return accounts

def generate_transactions(accounts, count=500):
    transactions = []
    tx_types = ["Deposit", "Withdrawal", "Transfer", "Payment"]
    categories = ["Groceries", "Utilities", "Entertainment", "Healthcare", "Travel", "Retail", "Salary"]

    for i in range(1, count + 1):
        acc = random.choice(accounts)
        tx = {
            "transaction_id": f"TX_{i:07d}",
            "account_id": acc["account_id"],
            "customer_id": acc["customer_id"],
            "transaction_date": (datetime.now() - timedelta(days=random.randint(0, 90))).isoformat(),
            "amount": round(random.uniform(10.0, 5000.0), 2),
            "transaction_type": random.choice(tx_types),
            "merchant_category": random.choice(categories),
            "status": "COMPLETED"
        }
        transactions.append(tx)
    return transactions

def run_data_generator(s3_endpoint=None):
    print("Generating synthetic banking data...")
    customers = generate_customers(150)
    accounts = generate_accounts(customers)
    transactions = generate_transactions(accounts, 800)

    # Ensure buckets exist
    s3 = get_s3_client(s3_endpoint)
    ensure_buckets_exist(s3_endpoint)

    # Upload raw data into Bronze bucket as JSON
    print("Landing raw data into Bronze S3 bucket...")
    s3.put_object(
        Bucket="bronze",
        Key="raw/customers.json",
        Body=json.dumps(customers, indent=2).encode("utf-8")
    )
    s3.put_object(
        Bucket="bronze",
        Key="raw/accounts.json",
        Body=json.dumps(accounts, indent=2).encode("utf-8")
    )
    s3.put_object(
        Bucket="bronze",
        Key="raw/transactions.json",
        Body=json.dumps(transactions, indent=2).encode("utf-8")
    )

    print(f"Bronze Layer successfully populated:")
    print(f" - {len(customers)} Customers landed in bronze/raw/customers.json")
    print(f" - {len(accounts)} Accounts landed in bronze/raw/accounts.json")
    print(f" - {len(transactions)} Transactions landed in bronze/raw/transactions.json")

if __name__ == "__main__":
    endpoint = os.getenv("S3_ENDPOINT_URL", "http://localhost:5001")
    run_data_generator(endpoint)
