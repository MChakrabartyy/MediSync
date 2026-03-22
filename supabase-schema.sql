-- Clinical Data Reconciliation Engine - Database Schema
-- Created for Onye Inc internship assessment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: api_audit_logs
-- Purpose: Track all API requests for security, compliance, and debugging
CREATE TABLE IF NOT EXISTS api_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  api_key_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_size_bytes INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: reconciliation_results
-- Purpose: Store medication and lab reconciliation results from Claude AI
CREATE TABLE IF NOT EXISTS reconciliation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT UNIQUE NOT NULL,
  reconciliation_type TEXT NOT NULL, -- 'medication', 'lab', etc.
  input_records JSONB NOT NULL,
  identified_discrepancies JSONB,
  confidence_score FLOAT,
  recommendations TEXT,
  processed_by TEXT, -- Which Claude model
  processing_time_ms INTEGER,
  cost_tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: data_quality_scores
-- Purpose: Track data quality metrics for audit trail
CREATE TABLE IF NOT EXISTS data_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT UNIQUE NOT NULL,
  completeness_score FLOAT NOT NULL,
  accuracy_score FLOAT NOT NULL,
  timeliness_score FLOAT NOT NULL,
  overall_quality_score FLOAT NOT NULL,
  completeness_details JSONB,
  accuracy_details JSONB,
  timeliness_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: cost_tracking
-- Purpose: Monitor API costs to stay within free tier limits
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  service TEXT NOT NULL, -- 'anthropic', 'supabase', etc.
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 6),
  monthly_total_cost DECIMAL(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: rate_limit_tracking
-- Purpose: Track rate limit hits per IP address
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: cache_entries
-- Purpose: Store API response cache for cost optimization
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  ttl_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_api_audit_logs_timestamp ON api_audit_logs(timestamp DESC);
CREATE INDEX idx_api_audit_logs_endpoint ON api_audit_logs(endpoint);
CREATE INDEX idx_reconciliation_results_created_at ON reconciliation_results(created_at DESC);
CREATE INDEX idx_reconciliation_results_type ON reconciliation_results(reconciliation_type);
CREATE INDEX idx_data_quality_scores_created_at ON data_quality_scores(created_at DESC);
CREATE INDEX idx_cost_tracking_date ON cost_tracking(date DESC);
CREATE INDEX idx_cost_tracking_service ON cost_tracking(service);
CREATE INDEX idx_rate_limit_tracking_ip ON rate_limit_tracking(ip_address);
CREATE INDEX idx_cache_entries_expires ON cache_entries(ttl_expires_at);

-- Row Level Security (RLS) Policies
-- Note: Supabase projects have RLS disabled by default. Enable if needed via Settings > Authentication > Policies

-- Grant permissions (if using Supabase roles)
-- Note: Adjust based on your Supabase user roles

COMMENT ON TABLE api_audit_logs IS 'Audit trail for all API requests - critical for security and compliance';
COMMENT ON TABLE reconciliation_results IS 'Results from AI-powered medication and lab reconciliation';
COMMENT ON TABLE data_quality_scores IS 'Data quality assessment metrics';
COMMENT ON TABLE cost_tracking IS 'API cost tracking to stay within free tier';
COMMENT ON TABLE rate_limit_tracking IS 'Rate limit enforcement tracking';
COMMENT ON TABLE cache_entries IS 'Response cache for cost optimization';
