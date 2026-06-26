#!/usr/bin/env bash
set -e

if ! pgrep -x mongod > /dev/null 2>&1; then
  echo "Starting MongoDB..."
  if command -v brew > /dev/null 2>&1 && brew list mongodb-community > /dev/null 2>&1; then
    brew services start mongodb-community
  elif command -v mongod > /dev/null 2>&1; then
    mkdir -p ~/data/db
    mongod --fork --logpath /tmp/mongod.log --dbpath ~/data/db
  else
    echo ""
    echo "Error: MongoDB is not installed."
    echo "Install it with:"
    echo "  brew tap mongodb/brew && brew install mongodb-community"
    echo ""
    exit 1
  fi
else
  echo "MongoDB is already running."
fi

echo "Starting local-draw at http://localhost:8000"
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000
