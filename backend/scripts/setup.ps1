<#
.SYNOPSIS
  AeroArcade — One-command development environment setup for Windows.
.DESCRIPTION
  This script automates the entire development setup process:
  - Checks prerequisites (Node.js, Docker Desktop)
  - Copies .env.example to .env if .env doesn't exist
  - Installs root-level npm dependencies
  - Starts PostgreSQL and Redis via Docker Compose
  - Installs backend dependencies
  - Runs Prisma generate, migrate, and seed
  - Installs frontend dependencies
  - Prints success message with access URLs
.NOTES
  Run this from the repository root:
    powershell -ExecutionPolicy Bypass -File backend\scripts\setup.ps1
#>

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.ForegroundColor = "Cyan"
Write-Host "============================================"
Write-Host "  AeroArcade — Development Setup"
Write-Host "============================================"
Write-Host ""

# ---- Step 1: Check Node.js ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[1/8] Checking prerequisites..."
$Host.UI.RawUI.ForegroundColor = "White"

try {
    $nodeVersion = node --version
    Write-Host "  Node.js: $nodeVersion"
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Node.js is not installed or not in PATH."
    Write-Host "  Download and install Node.js 20+ from: https://nodejs.org/"
    exit 1
}

$npmVersion = npm --version
Write-Host "  npm: v$npmVersion"

# ---- Step 2: Check Docker Desktop ----
try {
    $dockerVersion = docker --version
    Write-Host "  Docker: $dockerVersion"
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Docker Desktop is not installed or not running."
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
}

try {
    $composeVersion = docker compose version
    Write-Host "  Docker Compose: $composeVersion"
} catch {
    Write-Host "  WARNING: 'docker compose' not found, trying 'docker-compose'..."
    try {
        $legacyCompose = docker-compose --version
        Write-Host "  docker-compose: $legacyCompose"
    } catch {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  ERROR: Docker Compose is not available."
        exit 1
    }
}

Write-Host ""

# ---- Step 3: Create .env ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[2/8] Configuring environment variables..."
$Host.UI.RawUI.ForegroundColor = "White"

$envPath = Join-Path -Path $PWD -ChildPath ".env"
$envExamplePath = Join-Path -Path $PWD -ChildPath ".env.example"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "  Created .env from .env.example"
    } else {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  ERROR: .env.example not found in $PWD"
        exit 1
    }
} else {
    Write-Host "  .env already exists, skipping"
}

Write-Host ""

# ---- Step 4: Install root dependencies ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[3/8] Installing root dependencies..."
$Host.UI.RawUI.ForegroundColor = "White"

npm install
if ($LASTEXITCODE -ne 0) {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: npm install failed at root level."
    exit 1
}
Write-Host "  Done"

Write-Host ""

# ---- Step 5: Start Docker containers ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[4/8] Starting Docker containers (PostgreSQL + Redis)..."
$Host.UI.RawUI.ForegroundColor = "White"

$composeFile = Join-Path -Path $PWD -ChildPath "docker\docker-compose.yml"

if (Test-Path $composeFile) {
    try {
        docker compose -f $composeFile up -d postgres redis
        Write-Host "  Containers started"
        Write-Host "  Waiting for PostgreSQL to be healthy..."
        Start-Sleep -Seconds 5

        # Wait up to 30 seconds for PostgreSQL to be healthy
        $maxRetries = 15
        $retryCount = 0
        $healthy = $false
        while ($retryCount -lt $maxRetries -and -not $healthy) {
            $logs = docker logs aeroarcade-postgres 2>&1
            if ($logs -match "database system is ready to accept connections") {
                $healthy = $true
                Write-Host "  PostgreSQL is ready"
            } else {
                $retryCount++
                Start-Sleep -Seconds 2
            }
        }

        if (-not $healthy) {
            Write-Host "  WARNING: Could not verify PostgreSQL health. Proceeding anyway..."
        }
    } catch {
        Write-Host "  ERROR: Failed to start Docker containers."
        Write-Host "  Ensure Docker Desktop is running."
        exit 1
    }
} else {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: docker-compose.yml not found at $composeFile"
    exit 1
}

Write-Host ""

# ---- Step 6: Install backend dependencies ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[5/8] Installing backend dependencies..."
$Host.UI.RawUI.ForegroundColor = "White"

$backendDir = Join-Path -Path $PWD -ChildPath "backend"
Set-Location $backendDir
npm install
if ($LASTEXITCODE -ne 0) {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Backend npm install failed."
    Set-Location $PWD
    exit 1
}
Write-Host "  Done"

Write-Host ""

# ---- Step 7: Prisma generate, migrate, seed ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[6/8] Setting up database (Prisma)..."
$Host.UI.RawUI.ForegroundColor = "White"

Write-Host "  Generating Prisma client..."
try {
    npx prisma generate
    Write-Host "  Prisma client generated"
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Prisma generate failed."
    Set-Location $PWD
    exit 1
}

Write-Host "  Running migrations..."
try {
    npx prisma migrate dev --name init --skip-seed
    Write-Host "  Migrations applied"
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Prisma migrate failed."
    Write-Host "  Ensure PostgreSQL is running (check: docker ps)"
    Set-Location $PWD
    exit 1
}

Write-Host "  Seeding database..."
try {
    npx prisma db seed
    Write-Host "  Database seeded"
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Prisma seed failed."
    Set-Location $PWD
    exit 1
}

Set-Location $PWD
Write-Host ""

# ---- Step 8: Install frontend dependencies ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[7/8] Installing frontend dependencies..."
$Host.UI.RawUI.ForegroundColor = "White"

$frontendDir = Join-Path -Path $PWD -ChildPath "frontend"
Set-Location $frontendDir
npm install
if ($LASTEXITCODE -ne 0) {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Frontend npm install failed."
    Set-Location $PWD
    exit 1
}
Set-Location $PWD
Write-Host "  Done"

Write-Host ""

# ---- Success ----
$Host.UI.RawUI.ForegroundColor = "Green"
Write-Host "============================================"
Write-Host "  Setup Complete!"
Write-Host "============================================"
Write-Host ""
$Host.UI.RawUI.ForegroundColor = "White"
Write-Host "  Start the development servers:"
Write-Host ""
Write-Host "    npm run dev"
Write-Host ""
Write-Host "  Or start them separately:"
Write-Host ""
Write-Host "    Terminal 1: cd backend  && npm run start:dev"
Write-Host "    Terminal 2: cd frontend && npm run dev"
Write-Host ""
Write-Host "  Access the application:"
Write-Host ""
Write-Host "    Frontend:      http://localhost:3000"
Write-Host "    API:           http://localhost:4000/api"
Write-Host "    Swagger Docs:  http://localhost:4000/api/docs"
Write-Host ""
Write-Host "  Seed Accounts:"
Write-Host ""
Write-Host "    Admin:  admin@probabilityarena.com / Admin123!"
Write-Host "    Demo:   demo@probabilityarena.com  / Demo123!"
Write-Host ""
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "  Happy coding!"
$Host.UI.RawUI.ForegroundColor = "White"
