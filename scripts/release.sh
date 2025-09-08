#!/bin/bash

# Release script for DateStamp
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

VERSION_TYPE=${1:-patch}

echo "📦 Creating a $VERSION_TYPE release..."

# Ensure we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ You must be on the main branch to create a release"
    exit 1
fi

# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash your changes."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Bump version
echo "⬆️ Bumping version..."
npm version $VERSION_TYPE -m "chore: bump version to %s"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

echo "✅ Version bumped to $NEW_VERSION"

# Push changes and tags
echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo "🎉 Release v$NEW_VERSION created successfully!"
echo "GitHub Actions will now build and publish the release."
echo "Check the Actions tab on GitHub for progress."