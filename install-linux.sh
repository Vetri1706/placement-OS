#!/usr/bin/env bash
# install-linux.sh — Install Placement OS AppImage with icon and desktop entry
set -e

APP_NAME="Placement OS"
EXEC_NAME="placement-os"
APPIMAGE=$(find "$(dirname "$0")/release" -name "*.AppImage" | head -1)

if [[ -z "$APPIMAGE" ]]; then
  echo "❌ No AppImage found in dist/. Run: npm run dist:linux"
  exit 1
fi

# Paths
INSTALL_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP_DIR="$HOME/.local/share/applications"

mkdir -p "$INSTALL_DIR" "$ICON_DIR" "$DESKTOP_DIR"

# 1. Copy AppImage
echo "→ Installing AppImage..."
cp "$APPIMAGE" "$INSTALL_DIR/$EXEC_NAME.AppImage"
chmod +x "$INSTALL_DIR/$EXEC_NAME.AppImage"

# 2. Copy icon
echo "→ Installing icon..."
cp "$(dirname "$0")/build/icon.png" "$ICON_DIR/$EXEC_NAME.png"

# 3. Create .desktop file
echo "→ Creating desktop entry..."
cat > "$DESKTOP_DIR/$EXEC_NAME.desktop" << EOF
[Desktop Entry]
Name=$APP_NAME
Comment=Offline AI-powered placement preparation with coding IDE, AI interviews, resume analyzer and roadmap planner
Exec=$INSTALL_DIR/$EXEC_NAME.AppImage
Icon=$EXEC_NAME
Terminal=false
Type=Application
Categories=Development;Education;
StartupWMClass=$EXEC_NAME
Keywords=placement;interview;coding;AI;resume;
EOF

# 4. Refresh icon and desktop caches
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
xdg-desktop-menu forceupdate 2>/dev/null || true

echo ""
echo "✅ Placement OS installed!"
echo "   AppImage : $INSTALL_DIR/$EXEC_NAME.AppImage"
echo "   Icon     : $ICON_DIR/$EXEC_NAME.png"
echo "   Desktop  : $DESKTOP_DIR/$EXEC_NAME.desktop"
echo ""
echo "   It now appears in your app menu and file manager shows the icon."
