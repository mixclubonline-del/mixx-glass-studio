# Prime Database Setup Script (PowerShell)
# Sets up local PostgreSQL instance for Prime Database development

Write-Host "🔧 Prime Database Setup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install PostgreSQL:"
    Write-Host "  Download from https://www.postgresql.org/download/windows/"
    Write-Host "  Or use: winget install PostgreSQL.PostgreSQL"
    exit 1
}

Write-Host "✅ PostgreSQL found" -ForegroundColor Green

# Check if PostgreSQL is running
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService -or $pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL service is not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Start PostgreSQL service:"
    Write-Host "  Start-Service postgresql-x64-15"
    Write-Host ""
    Read-Host "Press Enter after starting PostgreSQL, or Ctrl+C to cancel"
}

Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
Write-Host ""

# Database configuration
$DB_NAME = "prime_database_dev"
$DB_USER = "prime_user"
$DB_PASSWORD = "prime_dev_password_" + (-join ((48..57) + (97..102) | Get-Random -Count 16 | ForEach-Object {[char]$_}))

Write-Host "📝 Database Configuration:"
Write-Host "  Database: $DB_NAME"
Write-Host "  User: $DB_USER"
Write-Host "  Password: $DB_PASSWORD"
Write-Host ""

# Create .env file if it doesn't exist
$ENV_FILE = ".env.prime-db"
if (-not (Test-Path $ENV_FILE)) {
    @"
# Prime Database Development Configuration
PRIME_DB_HOST=localhost
PRIME_DB_PORT=5432
PRIME_DB_NAME=$DB_NAME
PRIME_DB_USER=$DB_USER
PRIME_DB_PASSWORD=$DB_PASSWORD
PRIME_DB_SSL=false
"@ | Out-File -FilePath $ENV_FILE -Encoding utf8
    Write-Host "✅ Created $ENV_FILE" -ForegroundColor Green
} else {
    Write-Host "⚠️  $ENV_FILE already exists, skipping..." -ForegroundColor Yellow
}

Write-Host ""

# Create database and user
Write-Host "🔨 Creating database and user..."

$createScript = @"
-- Create user if it doesn't exist
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
`$`$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
"@

$createScript | psql -U postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database and user created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create database and user" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Run schema migration
$SCHEMA_FILE = "docs/architecture/prime-database-schema.sql"
if (Test-Path $SCHEMA_FILE) {
    Write-Host "📦 Deploying schema..."
    $env:PGPASSWORD = $DB_PASSWORD
    psql -h localhost -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Schema deployment failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Schema file not found: $SCHEMA_FILE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Prime Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Load environment variables: Get-Content $ENV_FILE | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }"
Write-Host "  2. Test connection: psql -h localhost -U $DB_USER -d $DB_NAME"
Write-Host "  3. Start building Prime Auth system"
Write-Host ""
Write-Host "Connection string:"
Write-Host "  postgresql://$DB_USER`:$DB_PASSWORD@localhost:5432/$DB_NAME"
