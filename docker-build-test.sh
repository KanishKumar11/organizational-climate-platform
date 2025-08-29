#!/bin/bash

echo "Testing Docker build for organizational-climate-platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "Docker is running. Starting build..."

# Build the Docker image
docker build -t climate-platform-test . --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo "You can now run the container with:"
    echo "docker run -p 3000:3000 climate-platform-test"
else
    echo "❌ Docker build failed. Check the logs above for details."
    exit 1
fi