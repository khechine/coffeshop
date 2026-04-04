#!/bin/bash

# Configuration
VERSION=$(date +%Y%m%d%H%M)
MSG="Auto-deploy: sync $VERSION"

echo "🚀 Committing changes..."
git add .
git commit -m "$MSG"

echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Push successful!"
