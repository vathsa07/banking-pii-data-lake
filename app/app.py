import os
import sys
import streamlit as st
import pandas as pd
import plotly.express as px

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from governance.access_control import get_user_role_info, get_gold_customer_data, fetch_audit_logs
from pipeline.medallion import bronze_to_silver, silver_to_gold
from data_generator.generate_data import run_data_generator
from pipeline.s3_utils import get_s3_client

st.set_page_config(
    page_title="Banking PII & Governance Data Lake",
    page_icon="🏦",
    layout="wide"
)

# Header
st.title("🏦 Banking PII Masking & Governance Data Lake")
st.markdown("""
**Medallion Architecture (Bronze → Silver → Gold) with Role-Based Access Control (RBAC) & Automated Audit Logging**  
*Built with DuckDB, Postgres, Streamlit, Airflow, and moto S3.*
""")

# Sidebar Navigation & Role Login
st.sidebar.header("👤 User Authentication & Role")
demo_users = {
    "Alice Analyst (Data Analyst)": "alice_analyst",
    "Carol Compliance (Compliance Officer)": "carol_compliance",
    "Admin User (System Administrator)": "admin_user"
}

selected_label = st.sidebar.selectbox("Log in as User:", list(demo_users.keys()))
selected_username = demo_users[selected_label]

user_info = get_user_role_info(selected_username)
st.sidebar.markdown(f"**Logged in User:** `{user_info['username']}`")
st.sidebar.markdown(f"**Assigned Role:** `{user_info['role_name']}`")
if user_info["can_view_pii"]:
    st.sidebar.success("🔓 **PII Permission:** UNMASKED (Authorized)")
else:
    st.sidebar.warning("🔒 **PII Permission:** MASKED (Restricted)")

st.sidebar.markdown("---")
st.sidebar.header("⚡ Pipeline Controls")
s3_endpoint = os.getenv("S3_ENDPOINT_URL", "http://localhost:5001")

if st.sidebar.button("🔄 Trigger Full Pipeline (Bronze → Silver → Gold)"):
    with st.spinner("Running Data Generator and Medallion Pipeline..."):
        try:
            run_data_generator(s3_endpoint)
            bronze_to_silver(s3_endpoint)
            silver_to_gold(s3_endpoint)
            st.sidebar.success("Pipeline executed successfully!")
        except Exception as e:
            st.sidebar.error(f"Pipeline error: {e}")

# Main Tabs
tab1, tab2, tab3 = st.tabs([
    "📊 Gold Data Explorer (Role-Based View)",
    "📜 Banking Compliance Audit Logs",
    "📈 Business Analytics & Power BI Layer"
])

# Tab 1: Gold Data Explorer
with tab1:
    st.subheader("📊 Gold Layer: Customer Analytics Summary")
    st.markdown(f"Currently viewing data as **`{user_info['username']}`** (`{user_info['role_name']}`).")

    if not user_info["can_view_pii"]:
        st.info("🔒 **Data Protection Active:** You are logged in as an **Analyst**. All Personally Identifiable Information (PII) such as Name and Email are deterministically tokenized via HMAC-SHA256 to ensure GDPR Article 32 compliance.")
    else:
        st.success("🔓 **Compliance Audit Active:** You are logged in as a **Compliance Officer / Admin**. Tokens are dynamically resolved against the secure PostgreSQL `pii_vault` table.")

    try:
        df_gold = get_gold_customer_data(user_info["username"], s3_endpoint=s3_endpoint)
        st.dataframe(df_gold, use_container_width=True)

        col1, col2, col3 = st.columns(3)
        col1.metric("Total Customers", len(df_gold))
        col2.metric("Total Accounts Managed", int(df_gold["total_accounts"].sum()))
        col3.metric("Total Customer Balance", f"${df_gold['total_balance'].sum():,.2f}")
    except Exception as e:
        st.warning(f"No Gold data available yet. Please click 'Trigger Full Pipeline' in the sidebar. (Details: {e})")

# Tab 2: Compliance Audit Logs
with tab2:
    st.subheader("📜 Compliance & Security Audit Trail")
    st.markdown("""
    Every query against the data lake is logged into PostgreSQL `audit_logs` table for compliance auditing (GDPR Art 32 / PCI-DSS).
    """)

    try:
        logs_df = fetch_audit_logs(limit=100)
        
        # Summary metrics
        m1, m2, m3 = st.columns(3)
        m1.metric("Total Logged Access Events", len(logs_df))
        m2.metric("PII Unmasked Queries", len(logs_df[logs_df["pii_exposed"] == True]))
        m3.metric("Masked Queries", len(logs_df[logs_df["pii_exposed"] == False]))

        st.dataframe(logs_df, use_container_width=True)
    except Exception as e:
        st.error(f"Error reading audit logs: {e}")

# Tab 3: Business Analytics & Power BI Layer
with tab3:
    st.subheader("📈 Power BI Exported Business Aggregates")
    st.markdown("""
    These datasets are saved as Parquet files in `/powerbi_export/` for Power BI Desktop ingestion.
    """)

    export_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "powerbi_export"))
    tx_file = os.path.join(export_dir, "transaction_summary.parquet")
    risk_file = os.path.join(export_dir, "risk_segment_summary.parquet")

    if os.path.exists(tx_file) and os.path.exists(risk_file):
        df_tx_summary = pd.read_parquet(tx_file)
        df_risk_summary = pd.read_parquet(risk_file)

        col_a, col_b = st.columns(2)
        
        with col_a:
            st.markdown("### Transaction Volume by Region")
            fig_tx = px.bar(
                df_tx_summary,
                x="region",
                y="total_volume",
                color="transaction_type",
                barmode="group",
                title="Transaction Volume ($) by Region & Type"
            )
            st.plotly_chart(fig_tx, use_container_width=True)

        with col_b:
            st.markdown("### Customer Risk Segment Balance")
            fig_risk = px.pie(
                df_risk_summary,
                names="risk_segment",
                values="total_segment_balance",
                title="Total Account Balance by Risk Segment"
            )
            st.plotly_chart(fig_risk, use_container_width=True)
    else:
        st.warning("Power BI export files not found. Please click 'Trigger Full Pipeline' in the sidebar.")
