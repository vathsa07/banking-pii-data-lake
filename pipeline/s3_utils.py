import os
import boto3
from botocore.config import Config

def get_s3_client(endpoint_url=None):
    """
    Returns a boto3 S3 client configured for moto S3 server.
    """
    if not endpoint_url:
        endpoint_url = os.getenv("S3_ENDPOINT_URL", "http://moto-s3:5000")

    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID", "test")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "test")
    region_name = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=region_name,
        config=Config(signature_version="s3v4")
    )

def ensure_buckets_exist(endpoint_url=None):
    """
    Ensures that bronze, silver, and gold buckets exist in moto S3.
    """
    s3 = get_s3_client(endpoint_url)
    buckets = ["bronze", "silver", "gold"]
    
    existing = [b["Name"] for b in s3.list_buckets().get("Buckets", [])]
    for bucket in buckets:
        if bucket not in existing:
            print(f"Creating bucket: {bucket}")
            s3.create_bucket(Bucket=bucket)
        else:
            print(f"Bucket already exists: {bucket}")

if __name__ == "__main__":
    # Test connection when run directly from host
    host_endpoint = os.getenv("S3_ENDPOINT_URL", "http://localhost:5001")
    print(f"Initializing buckets at {host_endpoint}...")
    ensure_buckets_exist(host_endpoint)
    print("moto S3 initialization complete.")
