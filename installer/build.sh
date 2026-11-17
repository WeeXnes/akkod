#!/usr/bin/env bash
# Builds release/akkod-setup-<version>.exe: the Windows app zip embedded in an InstallerFramework wizard.
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
ZIP="$ROOT/release/akkod-$VERSION-win.zip"

if [ ! -d "lib/InstallerFramework/src" ]; then
  echo "[+] Framework missing, running ./setup.sh"
  ./setup.sh
fi

if [ ! -f "$ZIP" ] || [ "${REBUILD_APP:-0}" = "1" ]; then
  echo "[+] Building the Windows app ($ZIP)"
  (cd "$ROOT" && npm run dist:win-zip)
fi

mkdir -p Payload
cp "$ZIP" Payload/akkod-win.zip

echo "[+] Publishing single-file installer"
dotnet publish AkkodInstaller.csproj -c Release -r win-x64 \
  /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:AkkodVersion="$VERSION" \
  --self-contained true -o publish/win-x64

cp publish/win-x64/akkod-setup.exe "$ROOT/release/akkod-setup-$VERSION.exe"
echo "[OK] $ROOT/release/akkod-setup-$VERSION.exe"
