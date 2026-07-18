# AI Contract Review Platform - Setup Script
# This script helps set up the development environment

Write-Host "🚀 AI Contract Review Platform - Setup Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if pnpm is installed
Write-Host "Checking pnpm installation..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm $pnpmVersion installed" -ForegroundColor Green
} else {
    Write-Host "❌ pnpm is not installed. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✅ pnpm installed" -ForegroundColor Green
}

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
Write-Host "⚠️  Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow

# Check if Redis is accessible
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
Write-Host "⚠️  Make sure Redis is running on localhost:6379" -ForegroundColor Yellow

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please update it with your configuration." -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update the following in .env:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET" -ForegroundColor Yellow
    Write-Host "   - JWT_REFRESH_SECRET" -ForegroundColor Yellow
    Write-Host "   - AWS credentials (if using S3)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Cyan
Set-Location "packages\database"
pnpm db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}

Write-Host "✅ Prisma client generated" -ForegroundColor Green
Set-Location "..\..\"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env file with your configuration" -ForegroundColor White
Write-Host "2. Run: pnpm --filter @contract-ai/database db:migrate" -ForegroundColor White
Write-Host "3. Run: pnpm --filter @contract-ai/database db:seed" -ForegroundColor White
Write-Host "4. Run: pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@demo.com / Admin123!" -ForegroundColor White
Write-Host "  Lawyer: lawyer@demo.com / Lawyer123!" -ForegroundColor White
Write-Host ""
