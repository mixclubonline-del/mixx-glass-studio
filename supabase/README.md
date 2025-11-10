# MixClub Online Supabase Setup Guide

This guide will help you set up your Supabase database for the MixClub Online community platform.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `mixclub-online`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Credentials

1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 3. Update Environment Variables

Edit your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Database Setup

### 1. Run the Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL

### 2. Set Up Security Policies

1. Copy the contents of `supabase/rls-policies.sql`
2. Paste and run the SQL

### 3. Add Sample Data (Optional)

1. Copy the contents of `supabase/sample-data.sql`
2. Paste and run the SQL

## 🔐 Authentication Setup

### 1. Enable Email Authentication

1. Go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Configure email templates if needed

### 2. Set Up OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Enable providers like Google, GitHub, etc.
3. Add your OAuth credentials

## 📁 Storage Setup

### 1. Create Storage Buckets

1. Go to **Storage** → **Buckets**
2. Create buckets:
   - `avatars` - for user profile pictures
   - `covers` - for project cover images
   - `audio` - for audio files
   - `stems` - for project stems

### 2. Set Storage Policies

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to upload project covers
CREATE POLICY "Users can upload project covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view covers
CREATE POLICY "Anyone can view covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

-- Allow users to upload audio files
CREATE POLICY "Users can upload audio files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view audio files
CREATE POLICY "Anyone can view audio files" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');
```

## 🎯 Database Schema Overview

### Core Tables

- **users** - User profiles and authentication
- **projects** - Music projects and tracks
- **posts** - Community discussions
- **comments** - Post comments and replies
- **collaborations** - Project collaboration requests
- **collaboration_applications** - Applications for collaborations
- **follows** - User following system
- **likes** - Project and post likes
- **messages** - Direct messaging
- **notifications** - User notifications
- **reviews** - User reviews and ratings
- **tags** - Centralized tag management

### Key Features

- **Row Level Security (RLS)** - Secure data access
- **Automatic counters** - Real-time stats updates
- **Search functions** - Optimized user and project search
- **Triggers** - Automatic timestamp updates
- **Indexes** - Fast query performance

## 🔍 Useful Queries

### Search Users
```sql
SELECT * FROM search_users('luna', 'producer');
```

### Search Projects
```sql
SELECT * FROM search_projects('trap', 'Trap');
```

### Get User Profile
```sql
SELECT * FROM get_user_profile('11111111-1111-1111-1111-111111111111');
```

### Get Trending Projects
```sql
SELECT * FROM project_stats 
ORDER BY total_likes DESC, plays_count DESC 
LIMIT 10;
```

## 🚨 Important Notes

1. **Always use RLS** - Never disable row level security
2. **Test thoroughly** - Verify all policies work correctly
3. **Monitor performance** - Use the dashboard to check query performance
4. **Backup regularly** - Set up automated backups
5. **Update indexes** - Add indexes as your data grows

## 🆘 Troubleshooting

### Common Issues

1. **RLS blocking queries** - Check your policies
2. **Slow queries** - Add appropriate indexes
3. **Storage uploads failing** - Verify bucket policies
4. **Authentication not working** - Check provider settings

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**Your MixClub Online database is now ready! 🎵**
