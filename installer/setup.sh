#!/usr/bin/env bash
set -e

FRAMEWORK_DIR="lib/InstallerFramework"
REPO_URL="https://code.weexnes.dev/InstallerFramework.git"

echo "=================================================="
echo "          InstallerBase Setup Script"
echo "=================================================="

if [ -d "$FRAMEWORK_DIR/.git" ]; then
    echo "[+] InstallerFramework repository found in '$FRAMEWORK_DIR'."
    echo "[+] Updating framework source from remote..."
    git -C "$FRAMEWORK_DIR" pull
else
    echo "[+] Cloning InstallerFramework from '$REPO_URL'..."
    mkdir -p lib
    git clone "$REPO_URL" "$FRAMEWORK_DIR"
fi

echo "[+] Restoring .NET project dependencies..."
dotnet restore

echo ""
echo "=================================================="
echo " [SUCCESS] InstallerBase environment ready!"
echo " Run 'dotnet run' to launch the template installer."
echo " Run './build.sh' to compile single-file binary."
echo "=================================================="
