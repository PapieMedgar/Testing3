#!/bin/bash

# Source the .env file if it exists
if [ -f .env ]; then
    source .env
fi

# Extract database credentials from DATABASE_URI
if [ -n "$DATABASE_URI" ]; then
    # Parse the DATABASE_URI using sed and cut
    DB_USER=$(echo $DATABASE_URI | sed -n 's/mysql:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/mysql:\/\/[^:]*:\([^@]*\).*/\1/p')
    DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
    # Default values if DATABASE_URI is not set
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_PASSWORD=${DB_PASSWORD:-password}
    DB_NAME=${DB_NAME:-salesync}
fi

echo "Running migration on $DB_NAME database at $DB_HOST:$DB_PORT"

# Run the SQL migration directly
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < app/db_migrations/add_description_to_brands.sql

echo "Migration completed!"