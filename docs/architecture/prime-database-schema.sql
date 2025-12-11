-- Prime Database Schema
-- MixClub Studio - Proprietary Database Schema
-- Optimized for audio projects, Mixx Recall, and professional DAW workflows

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE prime_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  preferred_genres TEXT[] DEFAULT '{}',
  default_bpm INTEGER,
  default_key TEXT,
  preferred_lufs_target DECIMAL(5,2),
  devices JSONB DEFAULT '[]',
  last_active_device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Studio Projects Table
CREATE TABLE studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  bpm DECIMAL(6,2),
  key TEXT,
  time_signature TEXT DEFAULT '4/4',
  sample_rate INTEGER DEFAULT 44100,
  bit_depth INTEGER DEFAULT 24,
  target_lufs DECIMAL(5,2),
  current_lufs DECIMAL(5,2),
  dynamic_range DECIMAL(5,2),
  project_data JSONB NOT NULL,
  project_version INTEGER DEFAULT 1,
  project_size_bytes BIGINT,
  is_collaborative BOOLEAN DEFAULT false,
  collaborators JSONB DEFAULT '[]',
  audio_files_storage_path TEXT,
  stems_storage_path TEXT,
  snapshots_storage_path TEXT,
  tags TEXT[] DEFAULT '{}',
  genre TEXT,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ
);

-- Mixx Recall Table
CREATE TABLE mixx_recall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Snapshots Table
CREATE TABLE project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  snapshot_name TEXT,
  description TEXT,
  snapshot_type TEXT DEFAULT 'auto',
  project_data JSONB NOT NULL,
  project_version INTEGER NOT NULL,
  audio_analysis JSONB,
  musical_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES prime_users(id)
);

-- Session State Table
CREATE TABLE session_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  cursor_position DECIMAL(10,3),
  view_state JSONB,
  active_tool TEXT,
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio Files Metadata Table
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  duration_seconds DECIMAL(10,3) NOT NULL,
  sample_rate INTEGER NOT NULL,
  bit_depth INTEGER NOT NULL,
  channels INTEGER NOT NULL,
  format TEXT NOT NULL,
  audio_analysis JSONB,
  musical_context JSONB,
  is_stem BOOLEAN DEFAULT false,
  stem_type TEXT,
  parent_file_id UUID REFERENCES audio_files(id),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plugin Presets Table
CREATE TABLE plugin_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  plugin_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_system_preset BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaboration Sessions Table
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  session_name TEXT,
  started_by UUID REFERENCES prime_users(id) NOT NULL,
  participants JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTHENTICATION TABLES
-- ============================================================================

-- Auth Credentials Table
CREATE TABLE auth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  credential_type TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  salt TEXT,
  oauth_provider TEXT,
  oauth_id TEXT,
  oauth_data JSONB,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  reset_token TEXT,
  reset_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Auth Sessions Table
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  access_token_hash TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_prime_users_email ON prime_users(email);
CREATE INDEX idx_prime_users_username ON prime_users(username);

-- Projects indexes
CREATE INDEX idx_studio_projects_user_id ON studio_projects(user_id);
CREATE INDEX idx_studio_projects_updated_at ON studio_projects(updated_at DESC);
CREATE INDEX idx_studio_projects_genre ON studio_projects(genre);
CREATE INDEX idx_studio_projects_tags ON studio_projects USING GIN(tags);
CREATE INDEX idx_studio_projects_collaborative ON studio_projects(is_collaborative);

-- Mixx Recall indexes
CREATE INDEX idx_mixx_recall_user_id ON mixx_recall(user_id);
CREATE INDEX idx_mixx_recall_category ON mixx_recall(category);
CREATE INDEX idx_mixx_recall_data ON mixx_recall USING GIN(data);
CREATE INDEX idx_mixx_recall_last_used ON mixx_recall(last_used_at DESC);

-- Snapshots indexes
CREATE INDEX idx_project_snapshots_project_id ON project_snapshots(project_id);
CREATE INDEX idx_project_snapshots_user_id ON project_snapshots(user_id);
CREATE INDEX idx_project_snapshots_created_at ON project_snapshots(created_at DESC);

-- Session State indexes
CREATE INDEX idx_session_states_project_id ON session_states(project_id);
CREATE INDEX idx_session_states_user_id ON session_states(user_id);
CREATE INDEX idx_session_states_active ON session_states(is_active) WHERE is_active = true;
CREATE INDEX idx_session_states_heartbeat ON session_states(last_heartbeat);

-- Audio Files indexes
CREATE INDEX idx_audio_files_project_id ON audio_files(project_id);
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_stem_type ON audio_files(stem_type) WHERE is_stem = true;
CREATE INDEX idx_audio_files_tags ON audio_files USING GIN(tags);

-- Plugin Presets indexes
CREATE INDEX idx_plugin_presets_user_id ON plugin_presets(user_id);
CREATE INDEX idx_plugin_presets_plugin_type ON plugin_presets(plugin_type);
CREATE INDEX idx_plugin_presets_public ON plugin_presets(is_public) WHERE is_public = true;

-- Collaboration Sessions indexes
CREATE INDEX idx_collaboration_sessions_project_id ON collaboration_sessions(project_id);
CREATE INDEX idx_collaboration_sessions_active ON collaboration_sessions(is_active) WHERE is_active = true;

-- Auth indexes
CREATE INDEX idx_auth_credentials_user_id ON auth_credentials(user_id);
CREATE INDEX idx_auth_credentials_email ON auth_credentials(email);
CREATE INDEX idx_auth_credentials_oauth ON auth_credentials(oauth_provider, oauth_id);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_device ON auth_sessions(device_id);
CREATE INDEX idx_auth_sessions_active ON auth_sessions(is_revoked, refresh_token_expires_at) WHERE is_revoked = false;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_prime_users_updated_at 
  BEFORE UPDATE ON prime_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studio_projects_updated_at 
  BEFORE UPDATE ON studio_projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mixx_recall_updated_at 
  BEFORE UPDATE ON mixx_recall 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_states_updated_at 
  BEFORE UPDATE ON session_states 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plugin_presets_updated_at 
  BEFORE UPDATE ON plugin_presets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_credentials_updated_at 
  BEFORE UPDATE ON auth_credentials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's Mixx Recall data by category
CREATE OR REPLACE FUNCTION get_mixx_recall_by_category(
  p_user_id UUID,
  p_category TEXT
)
RETURNS TABLE (
  id UUID,
  data JSONB,
  confidence DECIMAL,
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.data,
    mr.confidence,
    mr.usage_count,
    mr.last_used_at
  FROM mixx_recall mr
  WHERE mr.user_id = p_user_id
    AND mr.category = p_category
  ORDER BY mr.usage_count DESC, mr.last_used_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update Mixx Recall usage
CREATE OR REPLACE FUNCTION update_mixx_recall_usage(
  p_user_id UUID,
  p_category TEXT,
  p_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_recall_id UUID;
BEGIN
  -- Try to find existing recall entry
  SELECT id INTO v_recall_id
  FROM mixx_recall
  WHERE user_id = p_user_id
    AND category = p_category
    AND data @> p_data
  LIMIT 1;

  IF v_recall_id IS NOT NULL THEN
    -- Update existing entry
    UPDATE mixx_recall
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE id = v_recall_id;
    RETURN v_recall_id;
  ELSE
    -- Create new entry
    INSERT INTO mixx_recall (user_id, category, data, usage_count)
    VALUES (p_user_id, p_category, p_data, 1)
    RETURNING id INTO v_recall_id;
    RETURN v_recall_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get project with latest snapshot
CREATE OR REPLACE FUNCTION get_project_with_snapshot(
  p_project_id UUID
)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  project_data JSONB,
  snapshot_id UUID,
  snapshot_name TEXT,
  snapshot_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.project_data,
    ps.id,
    ps.snapshot_name,
    ps.created_at
  FROM studio_projects sp
  LEFT JOIN LATERAL (
    SELECT id, snapshot_name, created_at
    FROM project_snapshots
    WHERE project_id = sp.id
    ORDER BY created_at DESC
    LIMIT 1
  ) ps ON true
  WHERE sp.id = p_project_id;
END;
$$ LANGUAGE plpgsql;
