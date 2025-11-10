-- MixClub Online Database Functions
-- Additional utility functions for the platform

-- Function to get user's feed (projects from followed users)
CREATE OR REPLACE FUNCTION get_user_feed(user_uuid UUID, limit_count INTEGER DEFAULT 20)
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
  artist_id UUID,
  artist_name TEXT,
  artist_username TEXT,
  artist_avatar TEXT,
  artist_role TEXT,
  is_liked BOOLEAN
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
    u.id as artist_id,
    u.display_name as artist_name,
    u.username as artist_username,
    u.avatar_url as artist_avatar,
    u.role as artist_role,
    EXISTS(SELECT 1 FROM likes WHERE user_id = user_uuid AND project_id = p.id) as is_liked
  FROM projects p
  JOIN users u ON p.user_id = u.id
  JOIN follows f ON f.following_id = u.id
  WHERE 
    f.follower_id = user_uuid
    AND p.is_public = true
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending projects
CREATE OR REPLACE FUNCTION get_trending_projects(limit_count INTEGER DEFAULT 20, genre_filter TEXT DEFAULT NULL)
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
  artist_id UUID,
  artist_name TEXT,
  artist_username TEXT,
  artist_avatar TEXT,
  artist_role TEXT,
  trend_score NUMERIC
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
    u.id as artist_id,
    u.display_name as artist_name,
    u.username as artist_username,
    u.avatar_url as artist_avatar,
    u.role as artist_role,
    (p.likes_count * 0.7 + p.plays_count * 0.3 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / -86400 * 0.1) as trend_score
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE 
    p.is_public = true
    AND p.created_at > NOW() - INTERVAL '30 days'
    AND (genre_filter IS NULL OR p.genre = genre_filter)
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's collaboration history
CREATE OR REPLACE FUNCTION get_user_collaborations(user_uuid UUID, status_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  budget DECIMAL(10,2),
  timeline TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  project_id UUID,
  project_title TEXT,
  project_genre TEXT,
  project_cover TEXT,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_username TEXT,
  other_user_avatar TEXT,
  other_user_role TEXT,
  is_artist BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.budget,
    c.timeline,
    c.status,
    c.created_at,
    p.id as project_id,
    p.title as project_title,
    p.genre as project_genre,
    p.cover_image_url as project_cover,
    CASE 
      WHEN c.artist_id = user_uuid THEN c.engineer_id
      ELSE c.artist_id
    END as other_user_id,
    CASE 
      WHEN c.artist_id = user_uuid THEN eu.display_name
      ELSE au.display_name
    END as other_user_name,
    CASE 
      WHEN c.artist_id = user_uuid THEN eu.username
      ELSE au.username
    END as other_user_username,
    CASE 
      WHEN c.artist_id = user_uuid THEN eu.avatar_url
      ELSE au.avatar_url
    END as other_user_avatar,
    CASE 
      WHEN c.artist_id = user_uuid THEN eu.role
      ELSE au.role
    END as other_user_role,
    (c.artist_id = user_uuid) as is_artist
  FROM collaborations c
  JOIN projects p ON c.project_id = p.id
  LEFT JOIN users au ON c.artist_id = au.id
  LEFT JOIN users eu ON c.engineer_id = eu.id
  WHERE 
    (c.artist_id = user_uuid OR c.engineer_id = user_uuid)
    AND (status_filter IS NULL OR c.status = status_filter)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's notifications
CREATE OR REPLACE FUNCTION get_user_notifications(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.is_read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_uuid
  ORDER BY n.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(user_uuid UUID, notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true 
  WHERE user_id = user_uuid AND id = ANY(notification_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project recommendations for a user
CREATE OR REPLACE FUNCTION get_project_recommendations(user_uuid UUID, limit_count INTEGER DEFAULT 10)
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
  artist_id UUID,
  artist_name TEXT,
  artist_username TEXT,
  artist_avatar TEXT,
  artist_role TEXT,
  recommendation_score NUMERIC
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
    u.id as artist_id,
    u.display_name as artist_name,
    u.username as artist_username,
    u.avatar_url as artist_avatar,
    u.role as artist_role,
    (
      CASE WHEN p.genre = ANY((SELECT genres FROM users WHERE id = user_uuid)) THEN 0.3 ELSE 0 END +
      CASE WHEN p.tags && (SELECT skills FROM users WHERE id = user_uuid) THEN 0.2 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM follows WHERE follower_id = user_uuid AND following_id = u.id) THEN 0.3 ELSE 0 END +
      CASE WHEN p.likes_count > 100 THEN 0.1 ELSE 0 END +
      CASE WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 0.1 ELSE 0 END
    ) as recommendation_score
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE 
    p.is_public = true
    AND p.user_id != user_uuid
    AND NOT EXISTS(SELECT 1 FROM likes WHERE user_id = user_uuid AND project_id = p.id)
  ORDER BY recommendation_score DESC, p.likes_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collaboration recommendations
CREATE OR REPLACE FUNCTION get_collaboration_recommendations(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  budget DECIMAL(10,2),
  timeline TEXT,
  requirements TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  project_id UUID,
  project_title TEXT,
  project_genre TEXT,
  project_cover TEXT,
  artist_id UUID,
  artist_name TEXT,
  artist_username TEXT,
  artist_avatar TEXT,
  artist_role TEXT,
  recommendation_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.budget,
    c.timeline,
    c.requirements,
    c.created_at,
    p.id as project_id,
    p.title as project_title,
    p.genre as project_genre,
    p.cover_image_url as project_cover,
    u.id as artist_id,
    u.display_name as artist_name,
    u.username as artist_username,
    u.avatar_url as artist_avatar,
    u.role as artist_role,
    (
      CASE WHEN p.genre = ANY((SELECT genres FROM users WHERE id = user_uuid)) THEN 0.3 ELSE 0 END +
      CASE WHEN c.requirements && (SELECT skills FROM users WHERE id = user_uuid) THEN 0.4 ELSE 0 END +
      CASE WHEN EXISTS(SELECT 1 FROM follows WHERE follower_id = user_uuid AND following_id = u.id) THEN 0.2 ELSE 0 END +
      CASE WHEN c.budget <= (SELECT hourly_rate FROM users WHERE id = user_uuid) * 10 THEN 0.1 ELSE 0 END
    ) as recommendation_score
  FROM collaborations c
  JOIN projects p ON c.project_id = p.id
  JOIN users u ON c.artist_id = u.id
  WHERE 
    c.status = 'open'
    AND c.artist_id != user_uuid
    AND NOT EXISTS(SELECT 1 FROM collaboration_applications WHERE collaboration_id = c.id AND applicant_id = user_uuid)
  ORDER BY recommendation_score DESC, c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_projects INTEGER,
  total_posts INTEGER,
  total_collaborations INTEGER,
  total_followers INTEGER,
  total_following INTEGER,
  total_likes_received INTEGER,
  total_likes_given INTEGER,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  total_plays INTEGER,
  total_downloads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM projects WHERE user_id = user_uuid AND is_public = true) as total_projects,
    (SELECT COUNT(*) FROM posts WHERE user_id = user_uuid) as total_posts,
    (SELECT COUNT(*) FROM collaborations WHERE artist_id = user_uuid OR engineer_id = user_uuid) as total_collaborations,
    (SELECT COUNT(*) FROM follows WHERE following_id = user_uuid) as total_followers,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_uuid) as total_following,
    (SELECT COUNT(*) FROM likes l JOIN projects p ON l.project_id = p.id WHERE p.user_id = user_uuid) as total_likes_received,
    (SELECT COUNT(*) FROM likes WHERE user_id = user_uuid) as total_likes_given,
    (SELECT AVG(rating) FROM reviews WHERE reviewee_id = user_uuid AND is_public = true) as average_rating,
    (SELECT COUNT(*) FROM reviews WHERE reviewee_id = user_uuid AND is_public = true) as total_reviews,
    (SELECT SUM(plays_count) FROM projects WHERE user_id = user_uuid AND is_public = true) as total_plays,
    (SELECT SUM(downloads_count) FROM projects WHERE user_id = user_uuid AND is_public = true) as total_downloads;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new collaboration
CREATE OR REPLACE FUNCTION create_collaboration(
  p_project_id UUID,
  p_artist_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_budget DECIMAL(10,2),
  p_timeline TEXT,
  p_requirements TEXT[],
  p_deliverables TEXT[]
)
RETURNS UUID AS $$
DECLARE
  collaboration_id UUID;
BEGIN
  INSERT INTO collaborations (
    project_id,
    artist_id,
    title,
    description,
    budget,
    timeline,
    requirements,
    deliverables
  ) VALUES (
    p_project_id,
    p_artist_id,
    p_title,
    p_description,
    p_budget,
    p_timeline,
    p_requirements,
    p_deliverables
  ) RETURNING id INTO collaboration_id;
  
  RETURN collaboration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply for collaboration
CREATE OR REPLACE FUNCTION apply_for_collaboration(
  p_collaboration_id UUID,
  p_applicant_id UUID,
  p_message TEXT,
  p_proposed_budget DECIMAL(10,2),
  p_proposed_timeline TEXT,
  p_portfolio_urls TEXT[]
)
RETURNS UUID AS $$
DECLARE
  application_id UUID;
BEGIN
  INSERT INTO collaboration_applications (
    collaboration_id,
    applicant_id,
    message,
    proposed_budget,
    proposed_timeline,
    portfolio_urls
  ) VALUES (
    p_collaboration_id,
    p_applicant_id,
    p_message,
    p_proposed_budget,
    p_proposed_timeline,
    p_portfolio_urls
  ) RETURNING id INTO application_id;
  
  -- Update applicants count
  UPDATE collaborations 
  SET applicants_count = applicants_count + 1 
  WHERE id = p_collaboration_id;
  
  -- Create notification for collaboration owner
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    c.artist_id,
    'collaboration',
    'New Collaboration Application',
    (SELECT display_name FROM users WHERE id = p_applicant_id) || ' applied to your collaboration "' || c.title || '"',
    json_build_object(
      'collaboration_id', p_collaboration_id,
      'applicant_id', p_applicant_id,
      'application_id', application_id
    )
  FROM collaborations c
  WHERE c.id = p_collaboration_id;
  
  RETURN application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_feed(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_trending_projects(INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_collaborations(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_project_recommendations(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_collaboration_recommendations(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_collaboration(UUID, UUID, TEXT, TEXT, DECIMAL, TEXT, TEXT[], TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_for_collaboration(UUID, UUID, TEXT, DECIMAL, TEXT, TEXT[]) TO anon, authenticated;
