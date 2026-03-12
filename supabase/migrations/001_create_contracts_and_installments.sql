-- Migration: Create contracts and installments tables
-- Created: 2024-01-25

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_no VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    otr DECIMAL(15, 2) NOT NULL,
    dp_amount DECIMAL(15, 2) NOT NULL,
    principal DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    period_months INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Installments table
CREATE TABLE IF NOT EXISTS installments (
    id SERIAL PRIMARY KEY,
    contract_no VARCHAR(50) NOT NULL REFERENCES contracts(contract_no) ON DELETE CASCADE,
    installment_no INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contract_no, installment_no)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_installments_contract_no ON installments(contract_no);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_contracts_client_name ON contracts(client_name);
