# Database Setup - Quick Fix

## Error: "client password must be a string"

This error means the PostgreSQL password is not configured. Follow these steps:

## Step 1: Create `.env` file in `backend/` directory

Create a file named `.env` in the `backend/` directory:

```bash
cd backend
touch .env
```

## Step 2: Add Database Configuration

Edit the `.env` file and add:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

DEFAULT_OFFICE_LATITUDE=28.6139
DEFAULT_OFFICE_LONGITUDE=77.2090
DEFAULT_OFFICE_RADIUS=60
DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
```

**Important**: Replace `your_postgres_password_here` with your actual PostgreSQL password!

## Step 3: Find Your PostgreSQL Password

### Option A: Try Common Defaults

Try connecting with common passwords:

```bash
# Try empty password
psql -U postgres

# Try common passwords
PGPASSWORD=postgres psql -U postgres
PGPASSWORD=admin psql -U postgres
PGPASSWORD=password psql -U postgres
```

### Option B: Reset PostgreSQL Password

If you don't know your password, reset it:

```bash
# Stop PostgreSQL
brew services stop postgresql@14
# OR
brew services stop postgresql

# Start in single-user mode
postgres --single -D /opt/homebrew/var/postgresql@14

# In the postgres prompt, run:
ALTER USER postgres WITH PASSWORD 'newpassword123';
\q

# Restart PostgreSQL
brew services start postgresql@14
```

### Option C: Use Your macOS Username

Create a database user with your macOS username:

```bash
# Connect to PostgreSQL (might work without password)
psql -d postgres

# Create user (replace 'anjanyelle' with your username)
CREATE USER anjanyelle WITH SUPERUSER PASSWORD 'your_password';
\q
```

Then update `.env`:
```env
DB_USER=anjanyelle
DB_PASSWORD=your_password
```

## Step 4: Verify Database Exists

Make sure the database exists:

```bash
psql -U postgres -c "CREATE DATABASE attendance_db;"
```

Or if using a different user:
```bash
psql -U your_username -c "CREATE DATABASE attendance_db;"
```

## Step 5: Test Connection

Test the connection:

```bash
# Test with psql
psql -U postgres -d attendance_db

# Or test with password
PGPASSWORD=your_password psql -U postgres -d attendance_db -c "SELECT 1;"
```

## Step 6: Restart Backend Server

After creating the `.env` file:

```bash
cd backend
npm start
```

You should see:
```
Connected to PostgreSQL database
Server is running on port 3000
```

## Troubleshooting

### Still Getting Password Error?

1. **Check `.env` file location**: Must be in `backend/` directory (same level as `package.json`)
2. **Check file name**: Must be exactly `.env` (not `.env.txt` or `env`)
3. **Check password format**: No quotes needed, just: `DB_PASSWORD=yourpassword`
4. **Restart server**: Stop (Ctrl+C) and restart after creating `.env`

### Database Doesn't Exist?

Run the setup script:

```bash
cd backend
psql -U postgres -f setup-database.sql
```

Or manually:

```bash
psql -U postgres
CREATE DATABASE attendance_db;
\c attendance_db
\i src/config/schema.sql
\q
```

### Connection Refused?

Make sure PostgreSQL is running:

```bash
brew services list
# Should show postgresql@14 or postgresql as "started"

# If not, start it:
brew services start postgresql@14
```

## Quick Test

Once `.env` is set up, test the login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

