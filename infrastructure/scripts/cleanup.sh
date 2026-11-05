#!/bin/bash

# Cleanup script for orphaned Docker resources from Skeptical Control
# This script removes containers, networks, and volumes created by testbed environments

set -e

echo "Cleaning up Skeptical Control Docker resources..."

# Remove all containers with the skeptical- prefix
echo "Removing skeptical containers..."
docker ps -a --filter "name=skeptical-" --format "{{.Names}}" | xargs -r docker rm -f

# Remove networks created by skeptical
echo "Removing skeptical networks..."
docker network ls --filter "name=skeptical-" --format "{{.Name}}" | xargs -r docker network rm

# Remove temporary docker-compose files
echo "Cleaning up workspace directories..."
if [ -d "workspaces" ]; then
  find workspaces -name "docker-compose-*.yml" -type f -delete
fi

echo "Cleanup complete!"
