# PowerShell Setup Script for InstallerBase
$ErrorActionPreference = "Stop"

$FrameworkDir = "lib\InstallerFramework"
$RepoUrl = "https://code.weexnes.dev/InstallerFramework.git"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "          InstallerBase Setup Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if (Test-Path "$FrameworkDir\.git") {
    Write-Host "[+] InstallerFramework repository found in '$FrameworkDir'." -ForegroundColor Yellow
    Write-Host "[+] Updating framework source from remote..." -ForegroundColor Yellow
    git -C "$FrameworkDir" pull
} else {
    Write-Host "[+] Cloning InstallerFramework from '$RepoUrl'..." -ForegroundColor Yellow
    if (!(Test-Path "lib")) { New-Item -ItemType Directory -Path "lib" | Out-Null }
    git clone $RepoUrl $FrameworkDir
}

Write-Host "[+] Restoring .NET project dependencies..." -ForegroundColor Yellow
dotnet restore

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " [SUCCESS] InstallerBase environment ready!" -ForegroundColor Green
Write-Host " Run 'dotnet run' to launch the template installer." -ForegroundColor Green
Write-Host " Run '.\build.ps1' to compile single-file binary." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
