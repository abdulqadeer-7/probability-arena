<#
.SYNOPSIS
  AeroArcade — Run Prisma migrations, generate client, and seed database.
.DESCRIPTION
  This script runs the full Prisma workflow:
  1. prisma generate — Regenerates the Prisma client
  2. prisma migrate dev — Applies pending migrations
  3. prisma db seed — Seeds the database with initial data

.NOTES
  Run from the repository root:
    powershell -ExecutionPolicy Bypass -File backend\scripts\migrate.ps1

  Or from the backend directory:
    cd backend
    ..\scripts\migrate.ps1

  To run without seeding, use the -SkipSeed switch:
    powershell -ExecutionPolicy Bypass -File backend\scripts\migrate.ps1 -SkipSeed

  To create a named migration:
    powershell -ExecutionPolicy Bypass -File backend\scripts\migrate.ps1 -MigrationName "add_user_avatar"
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$MigrationName = "",

    [Parameter(Mandatory = $false)]
    [switch]$SkipSeed = $false,

    [Parameter(Mandatory = $false)]
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host ""
    Write-Host "AeroArcade Migration Script"
    Write-Host "==========================="
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\backend\scripts\migrate.ps1                        # Run all pending migrations"
    Write-Host "  .\backend\scripts\migrate.ps1 -MigrationName "add_feature"  # Create a named migration"
    Write-Host "  .\backend\scripts\migrate.ps1 -SkipSeed              # Skip database seeding"
    Write-Host "  .\backend\scripts\migrate.ps1 -Help                  # Show this help"
    Write-Host ""
    exit 0
}

$Host.UI.RawUI.ForegroundColor = "Cyan"
Write-Host "============================================"
Write-Host "  AeroArcade — Database Migration"
Write-Host "============================================"
$Host.UI.RawUI.ForegroundColor = "White"
Write-Host ""

# Determine working directory — try backend/ first
$backendDir = $null

# Check if we're already in the backend directory
if ((Split-Path -Leaf (Get-Location)) -eq "backend") {
    $backendDir = Get-Location
} else {
    # Check if backend directory exists relative to current location
    $candidate = Join-Path -Path (Get-Location) -ChildPath "backend"
    if (Test-Path $candidate) {
        $backendDir = $candidate
    }
}

if (-not $backendDir) {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "ERROR: Cannot find backend/ directory."
    Write-Host "Run this script from the repository root or the backend/ directory."
    exit 1
}

$originalDir = Get-Location
Set-Location $backendDir

# Check if .env exists
$envFile = Join-Path -Path $backendDir -ChildPath "..\.env"
if (-not (Test-Path $envFile)) {
    $Host.UI.RawUI.ForegroundColor = "Yellow"
    Write-Host "WARNING: .env file not found at the repository root."
    Write-Host "Prisma may not be able to connect to the database."
    Write-Host "Create it by copying .env.example:"
    Write-Host "  Copy-Item .env.example .env"
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Set-Location $originalDir
        exit 1
    }
}

# Check if Prisma is installed
try {
    $prismaVersion = npx prisma --version 2>&1 | Select-String -Pattern "^prisma" | ForEach-Object { $_.Line }
    if ($prismaVersion) {
        Write-Host "Prisma: $prismaVersion"
    }
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "ERROR: Prisma is not installed. Run 'npm install' first."
    Set-Location $originalDir
    exit 1
}

Write-Host ""

# ---- Step 1: Generate Prisma Client ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[1/3] Generating Prisma client..."
$Host.UI.RawUI.ForegroundColor = "White"

try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Done"
    } else {
        throw "prisma generate failed with exit code $LASTEXITCODE"
    }
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  ERROR: Prisma generate failed."
    Write-Host "  $_"
    Set-Location $originalDir
    exit 1
}

Write-Host ""

# ---- Step 2: Run Migrations ----
$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[2/3] Running migrations..."
$Host.UI.RawUI.ForegroundColor = "White"

if ($MigrationName) {
    Write-Host "  Creating migration: $MigrationName"
    try {
        npx prisma migrate dev --name $MigrationName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Migration '$MigrationName' created and applied"
        } else {
            throw "prisma migrate dev failed with exit code $LASTEXITCODE"
        }
    } catch {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  ERROR: Failed to create migration."
        Write-Host "  $_"
        Set-Location $originalDir
        exit 1
    }
} else {
    Write-Host "  Applying pending migrations..."
    try {
        npx prisma migrate dev
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Migrations applied successfully"
        } else {
            throw "prisma migrate dev failed with exit code $LASTEXITCODE"
        }
    } catch {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  ERROR: Migration failed."
        Write-Host "  $_"
        Write-Host ""
        Write-Host "  Possible causes:"
        Write-Host "  - PostgreSQL is not running (check: docker ps)"
        Write-Host "  - DATABASE_URL in .env is incorrect"
        Write-Host "  - There are migration conflicts"
        $Host.UI.RawUI.ForegroundColor = "Yellow"
        Write-Host ""
        Write-Host "  To reset the database (WARNING: deletes all data):"
        Write-Host "    npx prisma migrate reset"
        Set-Location $originalDir
        exit 1
    }
}

Write-Host ""

# ---- Step 3: Seed Database ----
if (-not $SkipSeed) {
    $Host.UI.RawUI.ForegroundColor = "Yellow"
    Write-Host "[3/3] Seeding database..."
    $Host.UI.RawUI.ForegroundColor = "White"

    try {
        npx prisma db seed
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Database seeded"
        } else {
            throw "prisma db seed failed with exit code $LASTEXITCODE"
        }
    } catch {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  ERROR: Database seeding failed."
        Write-Host "  $_"
        Set-Location $originalDir
        exit 1
    }
} else {
    $Host.UI.RawUI.ForegroundColor = "Yellow"
    Write-Host "[3/3] Skipping database seed (-SkipSeed specified)"
}

Write-Host ""

# ---- Done ----
$Host.UI.RawUI.ForegroundColor = "Green"
Write-Host "============================================"
Write-Host "  Migration Complete!"
Write-Host "============================================"
$Host.UI.RawUI.ForegroundColor = "White"

Set-Location $originalDir
