-- Initialize Governance Database Schema

CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    can_view_pii BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_name VARCHAR(50) REFERENCES roles(role_name) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pii_vault (
    token VARCHAR(128) PRIMARY KEY,
    pii_type VARCHAR(50) NOT NULL,
    original_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(50) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_accessed VARCHAR(100) NOT NULL,
    records_returned INT DEFAULT 0,
    pii_exposed BOOLEAN DEFAULT FALSE,
    client_info TEXT
);

-- Seed initial roles
INSERT INTO roles (role_name, description, can_view_pii) VALUES
('analyst', 'Data Analyst - Can view aggregated metrics and tokenized/masked PII only', FALSE),
('compliance_officer', 'Compliance Officer - Authorized to view unmasked PII for auditing', TRUE),
('admin', 'System Administrator - Full system access including PII vault', TRUE)
ON CONFLICT (role_name) DO UPDATE 
SET description = EXCLUDED.description, can_view_pii = EXCLUDED.can_view_pii;

-- Seed initial demo users
INSERT INTO users (username, password_hash, role_name) VALUES
('alice_analyst', 'pbkdf2:sha256:analystpass', 'analyst'),
('carol_compliance', 'pbkdf2:sha256:compliancepass', 'compliance_officer'),
('admin_user', 'pbkdf2:sha256:adminpass', 'admin')
ON CONFLICT (username) DO UPDATE 
SET role_name = EXCLUDED.role_name;
