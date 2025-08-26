#!/bin/sh
set -e

# Wait for database if using Postgres
if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  until nc -z "$DB_HOST" "$DB_PORT"; do
    sleep 1
  done
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput || true

exec gunicorn server.wsgi:application --bind 0.0.0.0:8000 --workers 3
