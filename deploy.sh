#!/bin/bash

# Load configuration from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "❌ Error: .env file not found."
  exit 1
fi

# Configuration check
if [ -z "$ssh_server" ] || [ -z "$ssh_folder" ]; then
  echo "❌ Error: ssh_server or ssh_folder not set in .env."
  echo "Please add them to your .env file:"
  echo "ssh_server=debian@vps-..."
  echo "ssh_folder=/home/debian/coffeshop/"
  exit 1
fi

echo "🚀 Starting Deployment to $ssh_server..."

# 1. Push latest changes to GitHub
./git-push.sh

# 2. Sync .env.prod to VPS (as root .env)
echo "🔒 Syncing .env.prod to VPS..."
scp .env.prod $ssh_server:$ssh_folder/.env

# 3. SSH into VPS and run deployment commands
echo "🐳 Updating containers and database on VPS..."
ssh $ssh_server << EOF
  cd $ssh_folder
  git pull origin main
  
  echo "🔨 Building fresh Docker images..."
  docker compose build --no-cache || { echo "❌ Build failed"; exit 1; }
  
  echo "🚀 Starting containers..."
  docker compose up -d
  
  echo "🔑 Resetting database credentials..."
  # Use the password from .env synced earlier on the VPS
  docker compose exec -T postgres psql -U postgres -d coffeeshop -c "ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';"

  echo "🗄️ Synchronizing Prisma schema..."
  docker compose exec -T api npx prisma@5.14.0 db push --schema=packages/database/prisma/schema.prisma --accept-data-loss --skip-generate
  
  echo "🌱 Seeding data..."
  docker compose exec -T api /bin/sh -c "cd packages/database && npx prisma db seed"
  
  echo "🧹 Cleaning up unused images..."
  docker image prune -f
  
  echo "📊 Services status:"
  docker compose ps
  
  echo "✅ Deployment Successful!"
EOF

echo "🎉 Done! Application is updated."
