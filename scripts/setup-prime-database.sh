#!/bin/bash
# Prime Database Setup Script
# Sets up local PostgreSQL instance for Prime Database development

set -e

echo "🔧 Prime Database Setup"
echo "======================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed (try multiple locations)
PSQL_CMD=""
if command -v psql &> /dev/null; then
    PSQL_CMD="psql"
elif [ -f "/opt/homebrew/opt/postgresql@15/bin/psql" ]; then
    PSQL_CMD="/opt/homebrew/opt/postgresql@15/bin/psql"
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
elif [ -f "/usr/local/opt/postgresql@15/bin/psql" ]; then
    PSQL_CMD="/usr/local/opt/postgresql@15/bin/psql"
    export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
fi

if [ -z "$PSQL_CMD" ]; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS: brew install postgresql@15"
    echo "  Linux: sudo apt-get install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL found: $PSQL_CMD${NC}"

# Check if PostgreSQL is running
PG_ISREADY_CMD=""
if command -v pg_isready &> /dev/null; then
    PG_ISREADY_CMD="pg_isready"
elif [ -f "/opt/homebrew/opt/postgresql@15/bin/pg_isready" ]; then
    PG_ISREADY_CMD="/opt/homebrew/opt/postgresql@15/bin/pg_isready"
elif [ -f "/usr/local/opt/postgresql@15/bin/pg_isready" ]; then
    PG_ISREADY_CMD="/usr/local/opt/postgresql@15/bin/pg_isready"
fi

if [ -n "$PG_ISREADY_CMD" ] && ! $PG_ISREADY_CMD &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo ""
    echo "Start PostgreSQL:"
    echo "  macOS: brew services start postgresql@15"
    echo "  Linux: sudo systemctl start postgresql"
    echo ""
    read -p "Press Enter after starting PostgreSQL, or Ctrl+C to cancel..."
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Database configuration
DB_NAME="prime_database_dev"
DB_USER="prime_user"
DB_PASSWORD="prime_dev_password_$(openssl rand -hex 8)"

echo "📝 Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""

# Create .env file if it doesn't exist
ENV_FILE=".env.prime-db"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
# Prime Database Development Configuration
PRIME_DB_HOST=localhost
PRIME_DB_PORT=5432
PRIME_DB_NAME=$DB_NAME
PRIME_DB_USER=$DB_USER
PRIME_DB_PASSWORD=$DB_PASSWORD
PRIME_DB_SSL=false
EOF
    echo -e "${GREEN}✅ Created $ENV_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  $ENV_FILE already exists, skipping...${NC}"
fi

echo ""

# Create database and user
echo "🔨 Creating database and user..."

# Connect as postgres superuser to create database
# Try different methods based on installation
if [ -f "/opt/homebrew/opt/postgresql@15/bin/psql" ] || [ -f "/usr/local/opt/postgresql@15/bin/psql" ]; then
    # macOS Homebrew - use current user (no sudo needed)
    $PSQL_CMD postgres << EOF
-- Create user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database and user created${NC}"
    else
        echo -e "${YELLOW}⚠️  Trying alternative method...${NC}"
        
        # Try with sudo (for Linux installations)
        sudo -u postgres $PSQL_CMD << EOF
-- Create user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    fi
else
    # Linux/other - try with sudo
    sudo -u postgres $PSQL_CMD << EOF
-- Create user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
fi

echo ""

# Run schema migration
SCHEMA_FILE="docs/architecture/prime-database-schema.sql"
if [ -f "$SCHEMA_FILE" ]; then
    echo "📦 Deploying schema..."
    PGPASSWORD=$DB_PASSWORD $PSQL_CMD -h localhost -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Schema deployed successfully${NC}"
    else
        echo -e "${RED}❌ Schema deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Prime Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Load environment variables: source $ENV_FILE"
echo "  2. Test connection: psql -h localhost -U $DB_USER -d $DB_NAME"
echo "  3. Start building Prime Auth system"
echo ""
echo "Connection string:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
