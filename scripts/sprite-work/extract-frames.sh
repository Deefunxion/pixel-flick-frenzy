#!/bin/bash
# Sprite frame extraction script for One More Flick
# Extracts frames from row1_precise.png (success) and row2_precise.png (fail)
# and composites them into a 2816x128 horizontal strip

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
SPRITES_DIR="$PROJECT_DIR/public/assets/sprites"
WORK_DIR="$SCRIPT_DIR/frames"

# Source images
ROW1="$SPRITES_DIR/row1_precise.png"
ROW2="$SPRITES_DIR/row2_precise.png"

# Output
OUTPUT="$SPRITES_DIR/zeno-flipbook-new.png"

# Frame dimensions in source (11 cols x 3 rows, 2752x1536)
SRC_FRAME_W=250
SRC_FRAME_H=512

# Target frame size
TGT_FRAME_W=128
TGT_FRAME_H=128

# Total frames needed: 22 (matching existing format)
# Layout: idle(0-3), coil(4-7), [unused 8-9], bolt(10-12), impact(13-17), fail(18-21)

echo "=== Sprite Frame Extraction ==="
echo "Source 1: $ROW1"
echo "Source 2: $ROW2"
echo "Output: $OUTPUT"
echo ""

# Create working directory
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

# Function to extract a frame from source image
# Args: source_image col row output_name
extract_frame() {
    local src="$1"
    local col="$2"
    local row="$3"
    local out="$4"

    local x=$((col * SRC_FRAME_W))
    local y=$((row * SRC_FRAME_H))

    convert "$src" \
        -crop "${SRC_FRAME_W}x${SRC_FRAME_H}+${x}+${y}" \
        +repage \
        -resize "${TGT_FRAME_W}x${TGT_FRAME_H}" \
        -gravity center \
        -background transparent \
        -extent "${TGT_FRAME_W}x${TGT_FRAME_H}" \
        "$WORK_DIR/$out"

    echo "  Extracted: $out (col=$col, row=$row from $(basename $src))"
}

echo "Extracting frames from row1_precise.png (success animations)..."

# IDLE (frames 0-3): Standing poses from row1, row 0, cols 1-3
# Neutral standing with subtle variation for breathing loop
extract_frame "$ROW1" 1 0 "frame_00.png"  # idle 1 - standing
extract_frame "$ROW1" 2 0 "frame_01.png"  # idle 2 - slight shift
extract_frame "$ROW1" 3 0 "frame_02.png"  # idle 3 - variation
extract_frame "$ROW1" 2 0 "frame_03.png"  # idle 4 - back (for loop)

# COIL (frames 4-7): Crouching/charging poses
# From row1: crouch/ready sequence (row 0 cols 8-10, row 1 col 1)
extract_frame "$ROW1" 8 0 "frame_04.png"   # coil 1 - start crouch
extract_frame "$ROW1" 9 0 "frame_05.png"   # coil 2 - deeper crouch
extract_frame "$ROW1" 10 0 "frame_06.png"  # coil 3 - ready stance
extract_frame "$ROW1" 1 1 "frame_07.png"   # coil 4 - about to launch

# UNUSED (frames 8-9): Placeholder transparent frames
convert -size "${TGT_FRAME_W}x${TGT_FRAME_H}" xc:transparent "$WORK_DIR/frame_08.png"
convert -size "${TGT_FRAME_W}x${TGT_FRAME_H}" xc:transparent "$WORK_DIR/frame_09.png"
echo "  Created: frame_08.png (placeholder)"
echo "  Created: frame_09.png (placeholder)"

# BOLT (frames 10-12): Flying poses
# From row1: jumping/flying frames (row 1 cols 4-6)
extract_frame "$ROW1" 4 1 "frame_10.png"  # bolt 1 - launch/leap
extract_frame "$ROW1" 5 1 "frame_11.png"  # bolt 2 - mid-air arms out
extract_frame "$ROW1" 6 1 "frame_12.png"  # bolt 3 - flying

# IMPACT (frames 13-17): Landing sequence
# From row1: landing poses (row 2 cols 0-4)
extract_frame "$ROW1" 0 2 "frame_13.png"  # impact 1 - feet touching
extract_frame "$ROW1" 1 2 "frame_14.png"  # impact 2 - absorbing
extract_frame "$ROW1" 2 2 "frame_15.png"  # impact 3 - crouched
extract_frame "$ROW1" 3 2 "frame_16.png"  # impact 4 - rising
extract_frame "$ROW1" 4 2 "frame_17.png"  # impact 5 - standing

echo ""
echo "Extracting frames from row2_precise.png (failure animations)..."

# FAIL (frames 18-21): Tumble/fall sequence
# From row2: falling (row 1 cols 5-7) and dizzy (row 2 col 4)
extract_frame "$ROW2" 5 1 "frame_18.png"  # fail 1 - stumble/trip
extract_frame "$ROW2" 6 1 "frame_19.png"  # fail 2 - falling
extract_frame "$ROW2" 7 1 "frame_20.png"  # fail 3 - tumbling
extract_frame "$ROW2" 4 2 "frame_21.png"  # fail 4 - dizzy with stars

echo ""
echo "Compositing into horizontal strip..."

# Combine all frames into a horizontal strip
convert "$WORK_DIR"/frame_*.png +append "$OUTPUT"

echo ""
echo "=== Done! ==="
echo "Output: $OUTPUT"
echo "Dimensions: $(identify -format '%wx%h' "$OUTPUT")"
echo ""
echo "To test, copy to replace zeno-flipbook.png:"
echo "  cp '$OUTPUT' '$SPRITES_DIR/zeno-flipbook.png'"
