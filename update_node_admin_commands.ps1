# PowerShell Commands for GLOBAL Node.js and npm Updates
# MUST RUN AS ADMINISTRATOR - Right-click PowerShell and select "Run as Administrator"

Write-Host "=== GLOBAL NODE.JS AND NPM UPDATE SCRIPT ===" -ForegroundColor Green
Write-Host "Current versions:" -ForegroundColor Yellow
Write-Host "Node.js: $(node --version)" -ForegroundColor Cyan
Write-Host "npm: $(npm --version)" -ForegroundColor Cyan
Write-Host ""

# ==================================================
# METHOD 1: Global npm Update (Most Common)
# ==================================================

Write-Host "METHOD 1: Updating npm globally..." -ForegroundColor Yellow
try {
    npm install -g npm@latest
    Write-Host "✅ npm updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ npm update failed. Try running as Administrator." -ForegroundColor Red
}

# ==================================================
# METHOD 2: Global Node.js Update using winget (Recommended)
# ==================================================

Write-Host "METHOD 2: Updating Node.js globally using winget..." -ForegroundColor Yellow
try {
    # Check if Node.js is installed via winget
    $nodeInstalled = winget list --id OpenJS.NodeJS
    if ($nodeInstalled) {
        winget upgrade OpenJS.NodeJS --silent
        Write-Host "✅ Node.js updated via winget!" -ForegroundColor Green
    } else {
        winget install OpenJS.NodeJS --silent
        Write-Host "✅ Node.js installed via winget!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ winget method failed, trying alternative..." -ForegroundColor Yellow
}

# ==================================================
# METHOD 3: Global Node.js Update using Chocolatey
# ==================================================

Write-Host "METHOD 3: Updating Node.js globally using Chocolatey..." -ForegroundColor Yellow
# First check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey first..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey installed!" -ForegroundColor Green
}

# Update Node.js with Chocolatey
try {
    choco upgrade nodejs -y
    Write-Host "✅ Node.js updated via Chocolatey!" -ForegroundColor Green
} catch {
    choco install nodejs -y
    Write-Host "✅ Node.js installed via Chocolatey!" -ForegroundColor Green
}

# ==================================================
# METHOD 4: Global Update using NVM for Windows
# ==================================================

Write-Host "METHOD 4: Using NVM for global Node.js management..." -ForegroundColor Yellow
if (Get-Command nvm -ErrorAction SilentlyContinue) {
    Write-Host "NVM detected. Installing latest LTS globally..." -ForegroundColor Cyan
    nvm install lts
    nvm use lts
    nvm alias default lts
    Write-Host "✅ Latest LTS Node.js set as global default!" -ForegroundColor Green
} else {
    Write-Host "⚠️ NVM not found. Install from: https://github.com/coreybutler/nvm-windows" -ForegroundColor Yellow
}

# ==================================================
# GLOBAL VERIFICATION AND CLEANUP
# ==================================================

Write-Host ""
Write-Host "=== FINAL GLOBAL VERIFICATION ===" -ForegroundColor Green

# Clear npm cache globally
Write-Host "Clearing global npm cache..." -ForegroundColor Cyan
npm cache clean --force

# Update global npm packages
Write-Host "Updating all global npm packages..." -ForegroundColor Cyan
npm update -g

# Verify final versions
Write-Host ""
Write-Host "🎉 GLOBAL UPDATE COMPLETE! 🎉" -ForegroundColor Green
Write-Host "New global versions:" -ForegroundColor Yellow
Write-Host "Node.js: $(node --version)" -ForegroundColor Cyan
Write-Host "npm: $(npm --version)" -ForegroundColor Cyan
Write-Host "npx: $(npx --version)" -ForegroundColor Cyan

# Show global npm packages
Write-Host ""
Write-Host "Global npm packages installed:" -ForegroundColor Yellow
npm list -g --depth=0

Write-Host ""
Write-Host "✅ Global Node.js and npm update completed successfully!" -ForegroundColor Green
Write-Host "🔄 Please restart VS Code and terminals to use updated versions." -ForegroundColor Yellow

# Optional: Set npm registry to official (in case it was changed)
Write-Host "Setting npm registry to official..." -ForegroundColor Cyan
npm config set registry https://registry.npmjs.org/

Write-Host ""
Write-Host "🚀 Ready to develop! Your global Node.js environment is updated!" -ForegroundColor Green
