#!/bin/bash

# Deploy VuePress docs to docs branch for GitHub Pages

set -e

echo "Building VuePress documentation..."
npm run docs:build

echo "Preparing docs branch..."
cd .vuepress/dist

# Initialize git if not already done
if [ ! -d .git ]; then
  git init
  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"
fi

# Add all files
git add -A

# Commit
git commit -m "Deploy documentation to docs branch - $(date)"

# Push to docs branch
git push -f origin HEAD:docs

echo "Documentation deployed to docs branch successfully!"