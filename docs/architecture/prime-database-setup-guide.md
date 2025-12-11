# Prime Database Setup Guide
**Development Environment Setup**

---

## Prerequisites

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Or use: `winget install PostgreSQL.PostgreSQL`
- Start PostgreSQL service from Services panel

**Verify Installation:**
```bash
psql --version
# Should show: psql (PostgreSQL) 15.x or higher
```

---

## Quick Setup (Automated)

### macOS/Linux
```bash
chmod +x scripts/setup-prime-database.sh
./scripts/setup-prime-database.sh
```

### Windows (PowerShell)
```powershell
.\scripts\setup-prime-database.ps1
```

The script will:
1. Check PostgreSQL installation
2. Create database and user
3. Deploy schema
4. Create `.env.prime-db` configuration file

---

## Manual Setup

### Step 1: Create Database and User

**Connect to PostgreSQL:**
```bash
# macOS/Linux (may need sudo)
sudo -u postgres psql

# Or if you have a local postgres user
psql postgres
```

**Create Database and User:**
```sql
-- Create user
CREATE USER prime_user WITH PASSWORD 'your_secure_password_here';

-- Create database
CREATE DATABASE prime_database_dev OWNER prime_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE prime_database_dev TO prime_user;

-- Exit
\q
```

### Step 2: Deploy Schema

```bash
# Set password (if needed)
export PGPASSWORD='your_secure_password_here'

# Deploy schema
psql -h localhost -U prime_user -d prime_database_dev -f docs/architecture/prime-database-schema.sql
```

### Step 3: Create Environment File

Create `.env.prime-db`:
```env
# Prime Database Development Configuration
PRIME_DB_HOST=localhost
PRIME_DB_PORT=5432
PRIME_DB_NAME=prime_database_dev
PRIME_DB_USER=prime_user
PRIME_DB_PASSWORD=your_secure_password_here
PRIME_DB_SSL=false
```

---

## Verify Setup

### Test Connection
```bash
psql -h localhost -U prime_user -d prime_database_dev
```

**Inside psql, verify tables:**
```sql
-- List all tables
\dt

-- Should show:
-- auth_credentials
-- auth_sessions
-- audio_files
-- collaboration_sessions
-- mixx_recall
-- plugin_presets
-- prime_users
-- project_snapshots
-- session_states
-- studio_projects

-- Check a table structure
\d studio_projects

-- Exit
\q
```

### Test Helper Functions
```sql
-- Test Mixx Recall function
SELECT * FROM get_mixx_recall_by_category(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'genre'
);
```

---

## Connection Strings

### Node.js/TypeScript
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PRIME_DB_HOST || 'localhost',
  port: parseInt(process.env.PRIME_DB_PORT || '5432'),
  database: process.env.PRIME_DB_NAME || 'prime_database_dev',
  user: process.env.PRIME_DB_USER || 'prime_user',
  password: process.env.PRIME_DB_PASSWORD,
  ssl: process.env.PRIME_DB_SSL === 'true',
});
```

### Connection String Format
```
postgresql://prime_user:password@localhost:5432/prime_database_dev
```

---

## Development Workflow

### 1. Start PostgreSQL
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Windows
Start-Service postgresql-x64-15
```

### 2. Load Environment Variables
```bash
# macOS/Linux
source .env.prime-db

# Or export manually
export PRIME_DB_HOST=localhost
export PRIME_DB_PORT=5432
export PRIME_DB_NAME=prime_database_dev
export PRIME_DB_USER=prime_user
export PRIME_DB_PASSWORD=your_password
```

### 3. Connect and Work
```bash
psql -h localhost -U prime_user -d prime_database_dev
```

---

## Troubleshooting

### PostgreSQL Not Running
**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**Windows:**
```powershell
Start-Service postgresql-x64-15
Get-Service postgresql*
```

### Permission Denied
**macOS/Linux:** May need to use `sudo`:
```bash
sudo -u postgres psql
```

Or create a local postgres user:
```bash
createuser -s postgres
```

### Connection Refused
- Check PostgreSQL is running: `pg_isready`
- Check port: Default is 5432
- Check firewall settings
- Verify connection string

### Schema Already Exists
If you need to reset:
```sql
-- Drop and recreate (WARNING: Deletes all data!)
DROP DATABASE IF EXISTS prime_database_dev;
CREATE DATABASE prime_database_dev OWNER prime_user;
```

Then redeploy schema:
```bash
psql -h localhost -U prime_user -d prime_database_dev -f docs/architecture/prime-database-schema.sql
```

---

## Next Steps

1. ✅ Database is set up
2. ✅ Schema is deployed
3. ✅ Environment configured
4. **Next:** Start building Prime Auth system
5. **Next:** Build Prime Database API layer

---

## Useful Commands

### View All Tables
```sql
\dt
```

### Describe Table Structure
```sql
\d table_name
```

### View All Functions
```sql
\df
```

### View Database Size
```sql
SELECT pg_size_pretty(pg_database_size('prime_database_dev'));
```

### View Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Database
```bash
pg_dump -h localhost -U prime_user -d prime_database_dev -F c -f prime_db_backup.dump
```

### Restore Database
```bash
pg_restore -h localhost -U prime_user -d prime_database_dev prime_db_backup.dump
```

---

*Context improved by Giga AI - Used PostgreSQL best practices and development setup patterns to create this guide.*
