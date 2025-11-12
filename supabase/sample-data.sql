-- MixClub Online Sample Data
-- Insert sample data for testing and development

-- Insert sample users
INSERT INTO users (id, email, username, display_name, role, bio, location, genres, skills, experience_level, hourly_rate, is_verified) VALUES
  ('11111111-1111-1111-1111-111111111111', 'luna@example.com', 'lunabeats', 'Luna Beats', 'producer', 'Dark trap producer from LA. Creating beats that hit different.', 'Los Angeles, CA', ARRAY['Trap', 'Hip-Hop', 'Dark'], ARRAY['Beat Making', 'Sound Design', 'Mixing'], 'professional', 150.00, true),
  ('22222222-2222-2222-2222-222222222222', 'urban@example.com', 'urbanflow', 'Urban Flow', 'artist', 'Hip-hop artist bringing fresh flows and authentic stories.', 'Atlanta, GA', ARRAY['Hip-Hop', 'R&B', 'Trap'], ARRAY['Songwriting', 'Vocal Production'], 'advanced', 100.00, true),
  ('33333333-3333-3333-3333-333333333333', 'echo@example.com', 'echochamber', 'Echo Chamber', 'engineer', 'Professional mixing and mastering engineer with 8+ years experience.', 'New York, NY', ARRAY['R&B', 'Soul', 'Hip-Hop'], ARRAY['Mixing', 'Mastering', 'Recording'], 'professional', 200.00, true),
  ('44444444-4444-4444-4444-444444444444', 'alex@example.com', 'alexchen', 'Alex Chen', 'engineer', 'Mixing engineer specializing in hip-hop and trap. Always learning new techniques.', 'Los Angeles, CA', ARRAY['Hip-Hop', 'Trap', 'R&B'], ARRAY['Mixing', 'Sound Design', 'Vocal Production'], 'advanced', 150.00, true),
  ('55555555-5555-5555-5555-555555555555', 'sarah@example.com', 'sarahmartinez', 'Sarah Martinez', 'producer', 'R&B producer creating smooth vibes and emotional beats.', 'Miami, FL', ARRAY['R&B', 'Soul', 'Hip-Hop'], ARRAY['Beat Making', 'Songwriting', 'Mixing'], 'professional', 120.00, true);

-- Insert sample projects
INSERT INTO projects (id, user_id, title, description, genre, bpm, key, duration, tags, mood, energy_level, plays_count, likes_count) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Midnight Vibes', 'Dark atmospheric trap beat perfect for late night sessions. Heavy 808s and haunting melodies.', 'Trap', 140, 'C# Minor', 204, ARRAY['dark', 'atmospheric', 'trap', '808'], 'Dark', 8, 15600, 1247),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'City Lights', 'Smooth hip-hop track with melodic elements and clean vocals.', 'Hip-Hop', 85, 'F Major', 178, ARRAY['urban', 'melodic', 'hip-hop', 'smooth'], 'Energetic', 6, 12300, 892),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Dream Sequence', 'Dreamy R&B track with lush production and soulful vocals.', 'R&B', 70, 'A Minor', 252, ARRAY['dreamy', 'soulful', 'r&b', 'lush'], 'Smooth', 4, 28900, 2156),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Street Symphony', 'Hard-hitting trap beat with orchestral elements and aggressive 808s.', 'Trap', 150, 'D Minor', 180, ARRAY['aggressive', 'orchestral', 'trap', 'hard'], 'Aggressive', 9, 8900, 567),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'Ocean Waves', 'Smooth R&B track with tropical vibes and laid-back production.', 'R&B', 75, 'G Major', 195, ARRAY['tropical', 'smooth', 'r&b', 'laid-back'], 'Smooth', 3, 15600, 1100);

-- Insert sample posts
INSERT INTO posts (id, user_id, title, content, type, category, tags, likes_count, comments_count) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 'Best practices for mixing trap vocals', 'I''ve been working on trap vocals for a while now and wanted to share some techniques that have worked really well for me. First, always start with proper gain staging...', 'tutorial', 'Mixing', ARRAY['mixing', 'vocals', 'trap', 'tutorial'], 47, 12),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', '55555555-5555-5555-5555-555555555555', 'Looking for collaboration on R&B project', 'I''m working on an R&B track and need a vocalist who can bring some soul to the hook. The track is in C minor, 75 BPM, and has a smooth, laid-back vibe...', 'collaboration', 'Collaboration', ARRAY['r&b', 'collaboration', 'vocals', 'soul'], 23, 8),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '11111111-1111-1111-1111-111111111111', 'Showcase: My latest beat - ''Midnight Drive''', 'Just finished this dark trap beat. Let me know what you think! Looking for feedback on the mix and arrangement. The 808s are hitting hard...', 'showcase', 'Showcase', ARRAY['trap', 'beat', 'showcase', 'dark'], 89, 15),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '22222222-2222-2222-2222-222222222222', 'Question: How do you approach vocal layering?', 'I''m working on a track and want to add some vocal layers for depth. What''s your process for layering vocals? Do you use harmonies, doubles, or something else?', 'question', 'Production', ARRAY['vocals', 'layering', 'harmony', 'production'], 34, 22),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '33333333-3333-3333-3333-333333333333', 'Mastering tips for streaming platforms', 'With streaming platforms having different loudness standards, here are some tips for mastering that work across all platforms...', 'tutorial', 'Mastering', ARRAY['mastering', 'streaming', 'loudness', 'tips'], 67, 18);

-- Insert sample collaborations
INSERT INTO collaborations (id, project_id, artist_id, title, description, budget, timeline, status, requirements, deliverables) VALUES
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'R&B Track Collaboration', 'Looking for a vocalist to collaborate on a smooth R&B track. The beat is already laid down, just need someone to bring the vocals to life.', 500.00, '2 weeks', 'open', ARRAY['Strong R&B vocals', 'Experience with melodic hooks', 'Professional recording setup'], ARRAY['Lead vocals', 'Background vocals', 'Harmonies']),
  ('llllllll-llll-llll-llll-llllllllllll', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Trap Beat Production', 'Need a producer to create a dark trap beat for my upcoming single. Looking for someone with experience in modern trap production.', 800.00, '1 week', 'open', ARRAY['Trap production experience', 'Dark/aggressive style', 'High-quality samples'], ARRAY['Complete beat', 'Stems', 'Mix-ready files']),
  ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Hip-Hop Mixing & Mastering', 'Looking for an experienced mixing engineer to polish my hip-hop track. Need someone who understands the genre and can bring out the best in the mix.', 300.00, '3 days', 'in_progress', ARRAY['Hip-hop mixing experience', 'Professional studio setup', 'Quick turnaround'], ARRAY['Mixed track', 'Mastered track', 'Stems']);

-- Insert sample follows
INSERT INTO follows (follower_id, following_id) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');

-- Insert sample likes
INSERT INTO likes (user_id, project_id) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Insert sample comments
INSERT INTO comments (post_id, user_id, content) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Great tips! I always start with proper gain staging too. One thing I''d add is to use parallel compression on trap vocals for that punchy sound.'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555555', 'Thanks for sharing! The EQ tips are spot on. I usually cut around 2-4kHz to reduce harshness.'),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', '22222222-2222-2222-2222-222222222222', 'I''d be interested in collaborating! I have experience with R&B vocals and love the smooth vibe you''re going for.'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '44444444-4444-4444-4444-444444444444', 'This beat is fire! The 808s are hitting perfectly. Maybe try adding some reverb to the lead melody for more depth?'),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '33333333-3333-3333-3333-333333333333', 'For vocal layering, I usually do: lead vocal, double (slightly detuned), harmony (3rd or 5th), and ad-libs. Pan them slightly for width.');

-- Insert sample reviews
INSERT INTO reviews (reviewer_id, reviewee_id, project_id, rating, comment, is_public) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Amazing beat! The production quality is top-notch and the dark vibe is exactly what I was looking for.', true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Professional work as always. The mix is clean and the 808s hit hard. Highly recommend!', true),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, 'Echo did an incredible job mixing this track. The vocals sit perfectly in the mix and the overall sound is polished.', true),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 'Great mixing work! The track sounds professional and ready for release.', true),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 'Urban Flow brought amazing energy to this track. The vocals are smooth and the flow is on point.', true);

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, data) VALUES
  ('11111111-1111-1111-1111-111111111111', 'like', 'New Like', 'Urban Flow liked your project "Midnight Vibes"', '{"project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "user_id": "22222222-2222-2222-2222-222222222222"}'),
  ('11111111-1111-1111-1111-111111111111', 'follow', 'New Follower', 'Echo Chamber started following you', '{"follower_id": "33333333-3333-3333-3333-333333333333"}'),
  ('22222222-2222-2222-2222-222222222222', 'comment', 'New Comment', 'Alex Chen commented on your post "Looking for collaboration on R&B project"', '{"post_id": "gggggggg-gggg-gggg-gggg-gggggggggggg", "user_id": "44444444-4444-4444-4444-444444444444"}'),
  ('33333333-3333-3333-3333-333333333333', 'collaboration', 'Collaboration Request', 'Urban Flow applied to your collaboration "R&B Track Collaboration"', '{"collaboration_id": "kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk", "user_id": "22222222-2222-2222-2222-222222222222"}'),
  ('44444444-4444-4444-4444-444444444444', 'review', 'New Review', 'Echo Chamber left a 5-star review for your work', '{"review_id": "nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnnn", "user_id": "33333333-3333-3333-3333-333333333333"}');

-- Update user counters based on sample data
UPDATE users SET 
  followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id),
  projects_count = (SELECT COUNT(*) FROM projects WHERE user_id = users.id AND is_public = true),
  rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = users.id AND is_public = true), 0),
  total_ratings = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = users.id AND is_public = true)
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- Update project counters
UPDATE projects SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE project_id = projects.id)
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

-- Update post counters
UPDATE posts SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id)
WHERE id IN (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'gggggggg-gggg-gggg-gggg-gggggggggggg',
  'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
  'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
  'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj'
);
