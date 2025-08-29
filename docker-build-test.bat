@echo off
echo Testing Docker build for organizational-climate-platform...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker Desktop.
    exit /b 1
)

echo Docker is running. Starting build...

REM Build the Docker image
docker build -t climate-platform-test . --no-cache

if %errorlevel% equ 0 (
    echo ✅ Docker build successful!
    echo You can now run the container with:
    echo docker run -p 3000:3000 climate-platform-test
) else (
    echo ❌ Docker build failed. Check the logs above for details.
    exit /b 1
)