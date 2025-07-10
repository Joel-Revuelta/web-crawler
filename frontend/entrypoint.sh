#!/bin/sh
# entrypoint.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run an initial install to catch any changes made while the container was down
echo "Running initial npm install..."
npm install

# Start the Next.js development server
echo "Starting Next.js dev server..."
npm run dev &

# Watch package.json for changes and run npm install if it's updated
while true; do
  inotifywait -e modify,create,delete /app/package.json
  echo "package.json changed, running npm install..."
  npm install
done
