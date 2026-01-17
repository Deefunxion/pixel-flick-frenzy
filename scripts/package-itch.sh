#!/bin/bash
# Package game for itch.io distribution
# Creates optimized zip with unnecessary files removed

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Building for itch.io..."
npm run build:itch

echo "Preparing itch-dist..."
rm -rf itch-dist
cp -a dist itch-dist

echo "Removing unnecessary files..."
# Remove folders (but keep icons - needed for UI)
rm -rf itch-dist/assets/brand \
       itch-dist/assets/game-screenshots-polished \
       itch-dist/placeholder.svg

# Remove large unused files from icons (wordmark is 6MB)
rm -f itch-dist/assets/icons/wordmark-flipbook.png

# Remove backup sprites (saves ~14MB)
rm -f itch-dist/assets/sprites/row1_precise.png \
      itch-dist/assets/sprites/row2_precise.png \
      itch-dist/assets/sprites/sprite_sheet_final.png \
      itch-dist/assets/sprites/sprite_sheet_combined.png \
      itch-dist/assets/sprites/sprite_sheet_2816x256_v2.png \
      itch-dist/assets/sprites/sprite_sheet_2816x256_v3.png \
      itch-dist/assets/sprites/zeno-flipbook-backup2.png \
      itch-dist/assets/sprites/zeno-flipbook-v1-backup.png \
      itch-dist/assets/sprites/zeno-flipbook-backup.png \
      itch-dist/assets/sprites/zeno-flipbook-original-backup.png

# Remove unused large files
rm -f itch-dist/assets/UI_ELEMENTS/ui_elements_clean.png \
      itch-dist/assets/background/items_manus_2ndTry/bg_items_clean_gen.png

# Remove unused audio (saves ~7MB)
rm -f itch-dist/assets/audio/game/background-ambient.wav \
      itch-dist/assets/audio/game/late_hold.wav \
      itch-dist/assets/audio/game/late_hold2.wav

# Resize favicon if ImageMagick available
if command -v convert &> /dev/null; then
    echo "Resizing favicon..."
    convert itch-dist/favicon.ico -resize 32x32 itch-dist/favicon.ico 2>/dev/null || true
fi

echo "Creating zip..."
rm -f one-more-flick-itch.zip
(cd itch-dist && zip -r ../one-more-flick-itch.zip .)

echo "Cleaning up..."
rm -rf itch-dist

SIZE=$(ls -lh one-more-flick-itch.zip | awk '{print $5}')
echo "✓ Created one-more-flick-itch.zip ($SIZE)"
