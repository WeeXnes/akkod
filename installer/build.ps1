# Builds release\akkod-setup-<version>.exe: the Windows app zip embedded in an InstallerFramework wizard.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$root = (Resolve-Path ..).Path
$version = (Get-Content "$root\package.json" | ConvertFrom-Json).version
$zip = "$root\release\akkod-$version-win.zip"

if (-not (Test-Path 'lib\InstallerFramework\src')) { .\setup.ps1 }

if (-not (Test-Path $zip) -or $env:REBUILD_APP -eq '1') {
  Push-Location $root; npm run dist:win-zip; Pop-Location
}

New-Item -ItemType Directory -Force Payload | Out-Null
Copy-Item $zip Payload\akkod-win.zip -Force

dotnet publish AkkodInstaller.csproj -c Release -r win-x64 `
  /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:AkkodVersion=$version `
  --self-contained true -o publish\win-x64

Copy-Item publish\win-x64\akkod-setup.exe "$root\release\akkod-setup-$version.exe" -Force
Write-Host "[OK] $root\release\akkod-setup-$version.exe"
