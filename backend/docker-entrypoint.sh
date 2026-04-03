#!/bin/sh
set -e

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
PGUSER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-research_progress}"

echo "Waiting for Postgres..."
until pg_isready -h db -U "$PGUSER" -q 2>/dev/null; do
  sleep 1
done

if ! psql -h db -U "$PGUSER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  echo "Creating database \"$DB_NAME\" (volume was empty or from older setup)..."
  psql -h db -U "$PGUSER" -d postgres -c "CREATE DATABASE $DB_NAME;"
fi

echo "Applying Prisma migrations..."
until npx prisma migrate deploy; do
  echo "Migrate failed, retrying in 2s..."
  sleep 2
done

exec "$@"
