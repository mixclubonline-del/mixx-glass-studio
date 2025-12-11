# Prime Database Architecture
**MixClub Studio - Proprietary Database Design**  
**Date:** 2025-12-11  
**Phase:** 2 - Foundation Planning

---

## Executive Summary

This document outlines the architecture for **Prime Database** - a proprietary PostgreSQL-compatible database system optimized for MixClub Studio's audio project workflows, Mixx Recall data, and professional DAW operations.

**Key Design Principles:**
- **Audio-First:** Optimized for audio project metadata, stems, and session state
- **Mixx Recall Native:** Built-in support for user preferences and workflow patterns
- **Performance:** Fast queries for timeline operations, project loading, and collaboration
- **Scalability:** Designed to handle large audio projects and real-time collaboration
- **Migration Path:** Compatible with Supabase during transition period

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  Prime Database System                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Prime Auth   │  │ Prime DB      │  │ Prime Sync   │ │
│  │ (Auth Layer) │  │ (PostgreSQL) │  │ (Real-time)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Prime API Layer (REST/GraphQL)           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Studio Client (Desktop/Web)               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### Core Tables

#### 1. Users Table
**Purpose:** User accounts and profiles (Studio-focused, not community platform)

```sql
CREATE TABLE prime_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication (handled by Prime Auth, stored here for reference)
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  username TEXT UNIQUE NOT NULL,
  
  -- Profile
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  
  -- Studio-specific preferences
  preferred_genres TEXT[] DEFAULT '{}',
  default_bpm INTEGER,
  default_key TEXT,
  preferred_lufs_target DECIMAL(5,2), -- Target mix level
  
  -- Device/Client info
  devices JSONB DEFAULT '[]', -- Array of registered devices
  last_active_device_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_prime_users_email ON prime_users(email);
CREATE INDEX idx_prime_users_username ON prime_users(username);
```

#### 2. Studio Projects Table
**Purpose:** Audio project metadata (optimized for DAW workflows)

```sql
CREATE TABLE studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Project Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Audio Context
  bpm DECIMAL(6,2), -- Supports decimal BPM (e.g., 140.5)
  key TEXT, -- Musical key (e.g., "C#m", "F")
  time_signature TEXT DEFAULT '4/4', -- e.g., "4/4", "3/4", "7/8"
  sample_rate INTEGER DEFAULT 44100,
  bit_depth INTEGER DEFAULT 24,
  
  -- Mix Context
  target_lufs DECIMAL(5,2), -- Target loudness
  current_lufs DECIMAL(5,2), -- Current mix level
  dynamic_range DECIMAL(5,2), -- Current dynamic range
  
  -- Project State
  project_data JSONB NOT NULL, -- Full project state (tracks, clips, mixer, etc.)
  project_version INTEGER DEFAULT 1, -- Version for optimistic locking
  project_size_bytes BIGINT, -- Size of project data
  
  -- Collaboration
  is_collaborative BOOLEAN DEFAULT false,
  collaborators JSONB DEFAULT '[]', -- Array of {user_id, role, permissions}
  
  -- Storage References
  audio_files_storage_path TEXT, -- Path to audio files in Prime Storage
  stems_storage_path TEXT, -- Path to stems in Prime Storage
  snapshots_storage_path TEXT, -- Path to project snapshots
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  genre TEXT,
  mood TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ
);

CREATE INDEX idx_studio_projects_user_id ON studio_projects(user_id);
CREATE INDEX idx_studio_projects_updated_at ON studio_projects(updated_at DESC);
CREATE INDEX idx_studio_projects_genre ON studio_projects(genre);
CREATE INDEX idx_studio_projects_tags ON studio_projects USING GIN(tags);
CREATE INDEX idx_studio_projects_collaborative ON studio_projects(is_collaborative);
```

#### 3. Mixx Recall Table
**Purpose:** Store user preferences, patterns, and workflow data

```sql
CREATE TABLE mixx_recall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Preference Categories
  category TEXT NOT NULL, -- 'genre', 'plugin', 'workflow', 'mixing', etc.
  
  -- Data (flexible JSONB structure)
  data JSONB NOT NULL,
  
  -- Examples of data structure:
  -- { "preferred_genres": ["hip-hop", "trap"], "confidence": 0.9 }
  -- { "plugin": "MixxDrive", "common_settings": {...}, "usage_count": 45 }
  -- { "typical_bpm": 140, "common_keys": ["C#m", "F#m"], "confidence": 0.85 }
  
  -- Metadata
  confidence DECIMAL(3,2) DEFAULT 1.0, -- How confident we are in this recall data
  usage_count INTEGER DEFAULT 1, -- How often this preference is used
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mixx_recall_user_id ON mixx_recall(user_id);
CREATE INDEX idx_mixx_recall_category ON mixx_recall(category);
CREATE INDEX idx_mixx_recall_data ON mixx_recall USING GIN(data);
CREATE INDEX idx_mixx_recall_last_used ON mixx_recall(last_used_at DESC);
```

#### 4. Project Snapshots Table
**Purpose:** Version history and snapshots for projects

```sql
CREATE TABLE project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Snapshot Info
  snapshot_name TEXT,
  description TEXT,
  snapshot_type TEXT DEFAULT 'auto', -- 'auto', 'manual', 'milestone'
  
  -- Snapshot Data
  project_data JSONB NOT NULL, -- Full project state at this snapshot
  project_version INTEGER NOT NULL,
  
  -- Audio Analysis (if available)
  audio_analysis JSONB, -- LUFS, spectral balance, etc.
  musical_context JSONB, -- Key, BPM, chord progressions
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES prime_users(id)
);

CREATE INDEX idx_project_snapshots_project_id ON project_snapshots(project_id);
CREATE INDEX idx_project_snapshots_user_id ON project_snapshots(user_id);
CREATE INDEX idx_project_snapshots_created_at ON project_snapshots(created_at DESC);
```

#### 5. Session State Table
**Purpose:** Real-time session state for collaboration

```sql
CREATE TABLE session_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session Info
  device_id TEXT NOT NULL, -- Device/client identifier
  session_token TEXT UNIQUE NOT NULL,
  
  -- State
  cursor_position DECIMAL(10,3), -- Timeline cursor position
  view_state JSONB, -- Zoom, scroll, visible tracks, etc.
  active_tool TEXT, -- Current tool selection
  
  -- Presence
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_states_project_id ON session_states(project_id);
CREATE INDEX idx_session_states_user_id ON session_states(user_id);
CREATE INDEX idx_session_states_active ON session_states(is_active) WHERE is_active = true;
CREATE INDEX idx_session_states_heartbeat ON session_states(last_heartbeat);
```

#### 6. Audio Files Metadata Table
**Purpose:** Metadata for audio files stored in Prime Storage

```sql
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- File Info
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_path TEXT NOT NULL, -- Path in Prime Storage
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Audio Properties
  duration_seconds DECIMAL(10,3) NOT NULL,
  sample_rate INTEGER NOT NULL,
  bit_depth INTEGER NOT NULL,
  channels INTEGER NOT NULL,
  format TEXT NOT NULL, -- 'wav', 'mp3', 'flac', etc.
  
  -- Analysis (if available)
  audio_analysis JSONB, -- Spectral analysis, loudness, etc.
  musical_context JSONB, -- Key, BPM, tempo, etc.
  
  -- Stem Info (if applicable)
  is_stem BOOLEAN DEFAULT false,
  stem_type TEXT, -- 'vocals', 'drums', 'bass', 'harmonic', etc.
  parent_file_id UUID REFERENCES audio_files(id), -- If this is a stem of another file
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audio_files_project_id ON audio_files(project_id);
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_stem_type ON audio_files(stem_type) WHERE is_stem = true;
CREATE INDEX idx_audio_files_tags ON audio_files USING GIN(tags);
```

#### 7. Plugin Presets Table
**Purpose:** User-created and system plugin presets

```sql
CREATE TABLE plugin_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE,
  
  -- Preset Info
  name TEXT NOT NULL,
  description TEXT,
  plugin_type TEXT NOT NULL, -- 'MixxDrive', 'MixxTune', etc.
  
  -- Preset Data
  parameters JSONB NOT NULL, -- Plugin parameter values
  
  -- Visibility
  is_public BOOLEAN DEFAULT false,
  is_system_preset BOOLEAN DEFAULT false, -- System/built-in presets
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plugin_presets_user_id ON plugin_presets(user_id);
CREATE INDEX idx_plugin_presets_plugin_type ON plugin_presets(plugin_type);
CREATE INDEX idx_plugin_presets_public ON plugin_presets(is_public) WHERE is_public = true;
```

#### 8. Collaboration Sessions Table
**Purpose:** Real-time collaboration sessions

```sql
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Session Info
  session_name TEXT,
  started_by UUID REFERENCES prime_users(id) NOT NULL,
  
  -- Participants
  participants JSONB NOT NULL, -- Array of {user_id, role, joined_at, permissions}
  
  -- State
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collaboration_sessions_project_id ON collaboration_sessions(project_id);
CREATE INDEX idx_collaboration_sessions_active ON collaboration_sessions(is_active) WHERE is_active = true;
```

---

## Prime Auth System Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Prime Auth System                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Email/Pass   │  │ OAuth (opt)  │  │ Device Auth  │ │
│  │ (Encrypted)  │  │ (User Ctrl)  │  │ (Desktop)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         JWT Token Management                     │  │
│  │  - Access tokens (short-lived)                  │  │
│  │  - Refresh tokens (long-lived)                  │  │
│  │  - Device tokens (desktop app)                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Session Management                       │  │
│  │  - Multi-device support                         │  │
│  │  - Session revocation                          │  │
│  │  - Activity tracking                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Auth Tables

#### 1. Auth Credentials Table
```sql
CREATE TABLE auth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Credential Type
  credential_type TEXT NOT NULL, -- 'email_password', 'oauth_google', 'oauth_github', etc.
  
  -- Email/Password (encrypted)
  email TEXT, -- For email/password auth
  password_hash TEXT, -- bcrypt/argon2 hash (never plain text)
  salt TEXT, -- Salt for password hashing
  
  -- OAuth (if applicable)
  oauth_provider TEXT, -- 'google', 'github', etc.
  oauth_id TEXT, -- OAuth provider user ID
  oauth_data JSONB, -- Additional OAuth data
  
  -- Security
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  
  -- Password Reset
  reset_token TEXT,
  reset_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_credentials_user_id ON auth_credentials(user_id);
CREATE INDEX idx_auth_credentials_email ON auth_credentials(email);
CREATE INDEX idx_auth_credentials_oauth ON auth_credentials(oauth_provider, oauth_id);
```

#### 2. Auth Sessions Table
```sql
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session Info
  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT, -- 'desktop', 'web', 'mobile'
  
  -- Tokens
  access_token_hash TEXT NOT NULL, -- Hash of access token (never store plain)
  refresh_token_hash TEXT NOT NULL, -- Hash of refresh token
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Security
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  
  -- Activity
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_device ON auth_sessions(device_id);
CREATE INDEX idx_auth_sessions_active ON auth_sessions(is_revoked, refresh_token_expires_at) WHERE is_revoked = false;
```

---

## Migration Strategy

### Phase 1: Parallel Operation (Months 1-3)
**Goal:** Build Prime Database alongside Supabase, maintain compatibility

1. **Deploy Prime Database**
   - Set up PostgreSQL instance
   - Deploy schema
   - Create Prime API layer

2. **Build Compatibility Layer**
   - Create adapter that routes to both Supabase and Prime DB
   - Dual-write to both systems
   - Read from Supabase (source of truth)

3. **Test & Validate**
   - Verify data integrity
   - Performance testing
   - User acceptance testing

### Phase 2: Data Migration (Months 4-5)
**Goal:** Migrate existing data from Supabase to Prime Database

1. **Data Export from Supabase**
   - Export all user data
   - Export all project data
   - Export Mixx Recall data (if exists)

2. **Data Transformation**
   - Transform Supabase schema to Prime schema
   - Map community platform data to Studio-focused data
   - Validate data integrity

3. **Data Import to Prime Database**
   - Import users
   - Import projects
   - Import related data

4. **Verification**
   - Compare record counts
   - Spot-check data accuracy
   - Performance validation

### Phase 3: Cutover (Months 6)
**Goal:** Switch to Prime Database as primary, Supabase as backup

1. **Read/Write Switch**
   - Update compatibility layer to read from Prime DB
   - Write to Prime DB only
   - Keep Supabase as read-only backup

2. **Monitor & Fix**
   - Monitor for issues
   - Fix any data inconsistencies
   - Performance optimization

3. **Supabase Deprecation**
   - Archive Supabase data
   - Remove Supabase dependencies
   - Complete migration

---

## Implementation Roadmap

### Month 1-2: Design & Setup
- ✅ Complete architecture design (this document)
- Set up PostgreSQL instance
- Create database schema
- Set up development environment

### Month 3-4: Prime Auth Implementation
- Build authentication system
- Implement email/password auth
- Implement JWT token management
- Build session management
- Security testing

### Month 5-6: Prime Database API
- Build REST API layer
- Implement CRUD operations
- Add query optimization
- Build caching layer
- Performance testing

### Month 7-8: Compatibility Layer
- Build Supabase adapter
- Implement dual-write system
- Build migration tooling
- Testing & validation

### Month 9-10: Data Migration
- Export Supabase data
- Transform & import to Prime DB
- Verification & testing
- Performance optimization

### Month 11-12: Cutover & Optimization
- Switch to Prime DB as primary
- Monitor & optimize
- Deprecate Supabase
- Documentation

---

## Performance Considerations

### Indexing Strategy
- **Primary Keys:** UUID with gen_random_uuid() for distribution
- **Foreign Keys:** Indexed for join performance
- **JSONB Fields:** GIN indexes for JSON queries
- **Array Fields:** GIN indexes for array operations
- **Timestamp Fields:** Indexed for time-based queries

### Query Optimization
- **Project Loading:** Optimized queries for full project state
- **Mixx Recall:** Fast lookups by user_id and category
- **Collaboration:** Efficient real-time state queries
- **Search:** Full-text search on relevant fields

### Caching Strategy
- **Project Data:** Cache frequently accessed projects
- **Mixx Recall:** Cache user preferences
- **Session State:** In-memory cache for active sessions
- **API Responses:** Cache common queries

---

## Security Considerations

### Data Protection
- **Encryption at Rest:** Database-level encryption
- **Encryption in Transit:** TLS/SSL for all connections
- **Password Hashing:** bcrypt/argon2 with salt
- **Token Security:** JWT tokens with short expiration

### Access Control
- **Row-Level Security:** User-based data access
- **API Authentication:** JWT token validation
- **Rate Limiting:** Prevent abuse
- **Audit Logging:** Track all data access

### Privacy
- **User Data Ownership:** Users own their data
- **Data Export:** Users can export all data
- **Data Deletion:** Complete data removal on request
- **GDPR Compliance:** Privacy-first design

---

## Next Steps

1. **Review & Approve Architecture** (Week 1)
   - Review this document
   - Approve schema design
   - Approve migration strategy

2. **Set Up Development Environment** (Week 2)
   - Provision PostgreSQL instance
   - Set up development database
   - Create migration scripts

3. **Begin Prime Auth Implementation** (Week 3+)
   - Start with authentication system
   - Build incrementally
   - Test thoroughly

---

*Context improved by Giga AI - Used comprehensive schema analysis, database design patterns, and migration strategies to create this architecture.*
