-- MixClub Online Row Level Security (RLS) Policies
-- Security policies for all tables

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects table policies
CREATE POLICY "Anyone can view public projects" ON projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Posts table policies
CREATE POLICY "Anyone can view posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Comments table policies
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Collaborations table policies
CREATE POLICY "Anyone can view open collaborations" ON collaborations
  FOR SELECT USING (status = 'open');

CREATE POLICY "Users can view their own collaborations" ON collaborations
  FOR SELECT USING (auth.uid() = artist_id OR auth.uid() = engineer_id);

CREATE POLICY "Users can insert collaborations for their projects" ON collaborations
  FOR INSERT WITH CHECK (
    auth.uid() = artist_id AND 
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update their own collaborations" ON collaborations
  FOR UPDATE USING (auth.uid() = artist_id OR auth.uid() = engineer_id);

-- Collaboration applications table policies
CREATE POLICY "Users can view applications for their collaborations" ON collaboration_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    EXISTS (
      SELECT 1 FROM collaborations 
      WHERE id = collaboration_id AND (artist_id = auth.uid() OR engineer_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert applications" ON collaboration_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Collaboration owners can update applications" ON collaboration_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM collaborations 
      WHERE id = collaboration_id AND (artist_id = auth.uid() OR engineer_id = auth.uid())
    )
  );

-- Follows table policies
CREATE POLICY "Users can view follows" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Likes table policies
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Messages table policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews table policies
CREATE POLICY "Anyone can view public reviews" ON reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own reviews" ON reviews
  FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Tags table policies
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tags" ON tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update tags" ON tags
  FOR UPDATE USING (true);

-- User sessions table policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  location TEXT,
  genres TEXT[],
  skills TEXT[],
  experience_level TEXT,
  hourly_rate DECIMAL(10,2),
  is_verified BOOLEAN,
  followers_count INTEGER,
  following_count INTEGER,
  projects_count INTEGER,
  rating DECIMAL(3,2),
  total_ratings INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.role,
    u.bio,
    u.location,
    u.genres,
    u.skills,
    u.experience_level,
    u.hourly_rate,
    u.is_verified,
    u.followers_count,
    u.following_count,
    u.projects_count,
    u.rating,
    u.total_ratings,
    u.created_at
  FROM users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_users(search_term TEXT, user_role TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  location TEXT,
  genres TEXT[],
  skills TEXT[],
  experience_level TEXT,
  hourly_rate DECIMAL(10,2),
  is_verified BOOLEAN,
  followers_count INTEGER,
  rating DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.role,
    u.bio,
    u.location,
    u.genres,
    u.skills,
    u.experience_level,
    u.hourly_rate,
    u.is_verified,
    u.followers_count,
    u.rating
  FROM users u
  WHERE 
    (u.display_name ILIKE '%' || search_term || '%' OR 
     u.username ILIKE '%' || search_term || '%' OR 
     u.bio ILIKE '%' || search_term || '%')
    AND (user_role IS NULL OR u.role = user_role)
  ORDER BY u.followers_count DESC, u.rating DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_projects(search_term TEXT, genre_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  genre TEXT,
  bpm INTEGER,
  key TEXT,
  duration INTEGER,
  cover_image_url TEXT,
  tags TEXT[],
  plays_count INTEGER,
  likes_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  artist_name TEXT,
  artist_username TEXT,
  artist_avatar TEXT,
  artist_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.genre,
    p.bpm,
    p.key,
    p.duration,
    p.cover_image_url,
    p.tags,
    p.plays_count,
    p.likes_count,
    p.created_at,
    u.display_name,
    u.username,
    u.avatar_url,
    u.role
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE 
    p.is_public = true
    AND (p.title ILIKE '%' || search_term || '%' OR 
         p.description ILIKE '%' || search_term || '%' OR 
         p.tags && string_to_array(search_term, ' '))
    AND (genre_filter IS NULL OR p.genre = genre_filter)
  ORDER BY p.likes_count DESC, p.plays_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
