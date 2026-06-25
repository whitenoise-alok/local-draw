#!/usr/bin/env bash
set -e

if ! pgrep -x mongod > /dev/null 2>&1; then
  echo "Starting MongoDB..."
  if command -v brew > /dev/null 2>&1 && brew list mongodb-community > /dev/null 2>&1; then
    brew services start mongodb-community
  else
    mkdir -p ~/data/db
    mongod --fork --logpath /tmp/mongod.log --dbpath ~/data/db
  fi
else
  echo "MongoDB is already running."
fi

echo "Starting local-draw at http://localhost:8000"
uvicorn backend.main:app --host 0.0.0.0 --port 8000
