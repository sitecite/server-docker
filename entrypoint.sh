#!/bin/sh

FLAG_FILE="/usr/src/app/.setup_done"

if [ ! -f "$FLAG_FILE" ]; then
  echo "First run detected! Running database setup..."
  npm run setup
  
  touch "$FLAG_FILE"
else
  echo "Subsequent run detected. Skipping setup."
fi

exec "$@"