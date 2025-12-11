-- Prime Database Vector Extension Migration
-- Adds pgvector support for CLaRa-style embedding storage
-- MixClub Studio - Vector Storage for Compressed Embeddings

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable pgvector extension for vector similarity search
-- Note: Requires pgvector extension to be installed on PostgreSQL server
-- Installation: https://github.com/pgvector/pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- VECTOR STORAGE TABLES
-- ============================================================================

-- Mixx Recall Embeddings Table
-- Stores compressed embeddings for user workflow patterns
CREATE TABLE IF NOT EXISTS mixx_recall_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  recall_id UUID REFERENCES mixx_recall(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  
  -- Vector embedding (typically 768 or 1536 dimensions)
  -- Using 1536 for compatibility with OpenAI-style embeddings
  -- Can be adjusted based on CLaRa model output dimensions
  embedding vector(1536) NOT NULL,
  
  -- Original text/metadata for reference (optional, can be compressed)
  original_text TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Compression info
  compression_ratio DECIMAL(5,2), -- e.g., 16.0, 64.0, 128.0
  model_name TEXT, -- e.g., 'clara-7b-instruct', 'text-embedding-3-large'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Snapshot Embeddings Table
-- Stores compressed embeddings for project states
CREATE TABLE IF NOT EXISTS project_snapshot_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE NOT NULL,
  snapshot_id UUID REFERENCES project_snapshots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Vector embedding
  embedding vector(1536) NOT NULL,
  
  -- Snapshot metadata
  snapshot_name TEXT,
  snapshot_type TEXT DEFAULT 'auto',
  
  -- Musical context (compressed into embedding, but keep key fields for filtering)
  bpm DECIMAL(6,2),
  key TEXT,
  genre TEXT,
  
  -- Original data size vs compressed size
  original_size_bytes BIGINT,
  compressed_size_bytes BIGINT,
  compression_ratio DECIMAL(5,2),
  
  -- Model info
  model_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prime Brain Cache Embeddings Table
-- Stores compressed embeddings for LLM responses
CREATE TABLE IF NOT EXISTS prime_brain_cache_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Embedding for the prompt+context combination
  prompt_embedding vector(1536) NOT NULL,
  
  -- Original prompt and context (for fallback/debugging)
  prompt_hash TEXT NOT NULL, -- Hash of prompt for quick lookup
  prompt_text TEXT, -- Optional: can be null if fully compressed
  context_hash TEXT,
  
  -- Compressed response (embedding representation)
  response_embedding vector(1536), -- Optional: if we compress responses too
  
  -- Or keep response text but use embedding for similarity search
  response_text TEXT, -- Full response (can be compressed later)
  
  -- Metadata
  model_name TEXT NOT NULL,
  temperature DECIMAL(3,2),
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,6),
  
  -- Compression info
  compression_ratio DECIMAL(5,2),
  
  -- Cache metadata
  cache_hits INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Musical Context Embeddings Table
-- Stores compressed embeddings for harmonic/musical analysis
CREATE TABLE IF NOT EXISTS musical_context_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
  audio_file_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES prime_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Vector embedding of musical context
  embedding vector(1536) NOT NULL,
  
  -- Key musical attributes (for filtering, embedding contains full context)
  key TEXT,
  scale TEXT,
  chord_progression TEXT[],
  bpm DECIMAL(6,2),
  time_signature TEXT,
  
  -- Analysis data (compressed into embedding)
  chromagram JSONB, -- Can be compressed
  harmonic_tension DECIMAL(3,2),
  consonance_score DECIMAL(3,2),
  
  -- Model info
  model_name TEXT,
  compression_ratio DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR VECTOR SIMILARITY SEARCH
-- ============================================================================

-- HNSW indexes for fast approximate nearest neighbor search
-- HNSW (Hierarchical Navigable Small World) is faster than IVFFlat for most use cases

-- Mixx Recall embeddings: search by user and similarity
CREATE INDEX IF NOT EXISTS idx_mixx_recall_embeddings_user_category 
  ON mixx_recall_embeddings(user_id, category);

CREATE INDEX IF NOT EXISTS idx_mixx_recall_embeddings_vector 
  ON mixx_recall_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Project snapshot embeddings: search by project and similarity
CREATE INDEX IF NOT EXISTS idx_project_snapshot_embeddings_project 
  ON project_snapshot_embeddings(project_id);

CREATE INDEX IF NOT EXISTS idx_project_snapshot_embeddings_vector 
  ON project_snapshot_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Prime Brain cache: search by prompt similarity
CREATE INDEX IF NOT EXISTS idx_prime_brain_cache_prompt_hash 
  ON prime_brain_cache_embeddings(prompt_hash);

CREATE INDEX IF NOT EXISTS idx_prime_brain_cache_vector 
  ON prime_brain_cache_embeddings 
  USING hnsw (prompt_embedding vector_cosine_ops);

-- Musical context: search by project and similarity
CREATE INDEX IF NOT EXISTS idx_musical_context_embeddings_project 
  ON musical_context_embeddings(project_id);

CREATE INDEX IF NOT EXISTS idx_musical_context_embeddings_vector 
  ON musical_context_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- HELPER FUNCTIONS FOR VECTOR OPERATIONS
-- ============================================================================

-- Function to find similar Mixx Recall patterns
CREATE OR REPLACE FUNCTION find_similar_mixx_recall(
  p_user_id UUID,
  p_category TEXT,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
  recall_id UUID,
  similarity DECIMAL,
  category TEXT,
  metadata JSONB,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mre.recall_id,
    1 - (mre.embedding <=> p_query_embedding) AS similarity,
    mre.category,
    mre.metadata,
    mr.last_used_at
  FROM mixx_recall_embeddings mre
  LEFT JOIN mixx_recall mr ON mre.recall_id = mr.id
  WHERE mre.user_id = p_user_id
    AND mre.category = p_category
    AND (1 - (mre.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY mre.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar projects
CREATE OR REPLACE FUNCTION find_similar_projects(
  p_query_embedding vector(1536),
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  similarity DECIMAL,
  bpm DECIMAL,
  key TEXT,
  genre TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pse.project_id,
    sp.name,
    1 - (pse.embedding <=> p_query_embedding) AS similarity,
    pse.bpm,
    pse.key,
    pse.genre
  FROM project_snapshot_embeddings pse
  JOIN studio_projects sp ON pse.project_id = sp.id
  WHERE (p_user_id IS NULL OR pse.user_id = p_user_id)
    AND (1 - (pse.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY pse.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar musical contexts
CREATE OR REPLACE FUNCTION find_similar_musical_contexts(
  p_query_embedding vector(1536),
  p_key TEXT DEFAULT NULL,
  p_genre TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold DECIMAL DEFAULT 0.75
)
RETURNS TABLE (
  project_id UUID,
  audio_file_id UUID,
  similarity DECIMAL,
  key TEXT,
  scale TEXT,
  bpm DECIMAL,
  harmonic_tension DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mce.project_id,
    mce.audio_file_id,
    1 - (mce.embedding <=> p_query_embedding) AS similarity,
    mce.key,
    mce.scale,
    mce.bpm,
    mce.harmonic_tension
  FROM musical_context_embeddings mce
  WHERE (p_key IS NULL OR mce.key = p_key)
    AND (p_genre IS NULL OR mce.genre = p_genre)
    AND (1 - (mce.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY mce.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar cached responses
CREATE OR REPLACE FUNCTION find_similar_cache(
  p_query_embedding vector(1536),
  p_model_name TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5,
  p_similarity_threshold DECIMAL DEFAULT 0.85
)
RETURNS TABLE (
  cache_id UUID,
  similarity DECIMAL,
  response_text TEXT,
  model_name TEXT,
  cache_hits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pbce.id,
    1 - (pbce.prompt_embedding <=> p_query_embedding) AS similarity,
    pbce.response_text,
    pbce.model_name,
    pbce.cache_hits
  FROM prime_brain_cache_embeddings pbce
  WHERE (p_model_name IS NULL OR pbce.model_name = p_model_name)
    AND (pbce.expires_at IS NULL OR pbce.expires_at > NOW())
    AND (1 - (pbce.prompt_embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY pbce.prompt_embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger for mixx_recall_embeddings
CREATE TRIGGER update_mixx_recall_embeddings_updated_at 
  BEFORE UPDATE ON mixx_recall_embeddings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES
-- ============================================================================

-- Vector Dimension Notes:
-- - 1536 dimensions: Compatible with OpenAI text-embedding-3-large, many modern models
-- - 768 dimensions: Common for smaller models (BERT-base, etc.)
-- - Adjust based on CLaRa model output dimensions
-- - Can create multiple embedding columns for different models if needed

-- HNSW Index Parameters:
-- - Default m (connections): 16
-- - Default ef_construction (search width): 64
-- - Can be tuned for better performance vs. accuracy trade-off
-- - Example: CREATE INDEX ... USING hnsw (embedding vector_cosine_ops) WITH (m = 32, ef_construction = 100);

-- Similarity Metrics:
-- - <=> operator: Cosine distance (1 - cosine similarity)
-- - <-> operator: L2 distance (Euclidean)
-- - <#> operator: Inner product (negative cosine similarity)
-- - Cosine similarity is best for text embeddings
