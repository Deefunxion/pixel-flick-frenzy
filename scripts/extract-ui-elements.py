#!/usr/bin/env python3
"""
UI Element Extractor - Content-aware sprite sheet cutter
Detects individual UI elements and exports them as separate PNGs
Handles both transparent and solid-background sprite sheets
"""

import os
import sys
from PIL import Image
import numpy as np
from scipy import ndimage
from collections import Counter

def get_background_color(data, sample_size=100):
    """
    Detect background color by sampling corners and edges.
    Returns the most common color found in edge regions.
    """
    h, w = data.shape[:2]

    # Sample from corners and edges
    samples = []

    # Corners (10x10 regions)
    corners = [
        data[0:sample_size, 0:sample_size],           # top-left
        data[0:sample_size, w-sample_size:w],         # top-right
        data[h-sample_size:h, 0:sample_size],         # bottom-left
        data[h-sample_size:h, w-sample_size:w],       # bottom-right
    ]

    for corner in corners:
        for row in corner:
            for pixel in row:
                samples.append(tuple(pixel[:3]))  # RGB only

    # Find most common color
    counter = Counter(samples)
    bg_color = counter.most_common(1)[0][0]
    print(f"Detected background color: RGB{bg_color}")
    return bg_color


def extract_elements(input_path, output_dir, padding=4, min_size=15, color_threshold=30):
    """
    Extract individual UI elements from a sprite sheet.

    Args:
        input_path: Path to the sprite sheet PNG
        output_dir: Directory to save extracted elements
        padding: Extra pixels around each element
        min_size: Minimum width/height to consider as valid element
        color_threshold: How different a pixel must be from bg to be "foreground"
    """
    # Load image
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Detect background color
    bg_color = get_background_color(data)

    # Create mask: pixels that are NOT background
    # Calculate color distance from background
    rgb = data[:, :, :3].astype(np.int16)
    bg = np.array(bg_color, dtype=np.int16)

    # Euclidean distance from background color
    distance = np.sqrt(np.sum((rgb - bg) ** 2, axis=2))

    # Mask: True where pixel is different enough from background
    mask = distance > color_threshold

    print(f"Foreground pixels: {np.sum(mask)} / {mask.size} ({100*np.sum(mask)/mask.size:.1f}%)")

    # Label connected components
    labeled, num_features = ndimage.label(mask)
    print(f"Found {num_features} potential elements")

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    extracted = []

    for i in range(1, num_features + 1):
        # Find bounding box for this component
        component_mask = labeled == i
        rows = np.any(component_mask, axis=1)
        cols = np.any(component_mask, axis=0)

        if not rows.any() or not cols.any():
            continue

        y_min, y_max = np.where(rows)[0][[0, -1]]
        x_min, x_max = np.where(cols)[0][[0, -1]]

        # Calculate dimensions
        width = x_max - x_min + 1
        height = y_max - y_min + 1

        # Skip tiny elements (noise)
        if width < min_size or height < min_size:
            print(f"  Skipping element {i}: too small ({width}x{height})")
            continue

        # Add padding
        y_min = max(0, y_min - padding)
        y_max = min(data.shape[0] - 1, y_max + padding)
        x_min = max(0, x_min - padding)
        x_max = min(data.shape[1] - 1, x_max + padding)

        # Crop element
        element = img.crop((x_min, y_min, x_max + 1, y_max + 1))

        # Generate filename
        filename = f"element_{i:02d}_{width}x{height}.png"
        output_path = os.path.join(output_dir, filename)

        # Save
        element.save(output_path)
        extracted.append({
            'index': i,
            'filename': filename,
            'x': x_min,
            'y': y_min,
            'width': x_max - x_min + 1,
            'height': y_max - y_min + 1
        })
        print(f"  Extracted: {filename} at ({x_min}, {y_min})")

    print(f"\nExtracted {len(extracted)} elements to {output_dir}")

    # Write manifest
    manifest_path = os.path.join(output_dir, 'manifest.txt')
    with open(manifest_path, 'w') as f:
        f.write(f"Source: {input_path}\n")
        f.write(f"Elements: {len(extracted)}\n\n")
        for e in extracted:
            f.write(f"{e['filename']}: x={e['x']}, y={e['y']}, {e['width']}x{e['height']}\n")

    return extracted


def main():
    if len(sys.argv) < 2:
        # Default: process ui_elements_clean.png
        input_path = 'dev-assets/2/ui_elements_clean.png'
    else:
        input_path = sys.argv[1]

    if len(sys.argv) < 3:
        # Default output directory
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_dir = f'public/assets/ui/{base_name}'
    else:
        output_dir = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    print(f"Extracting UI elements from: {input_path}")
    print(f"Output directory: {output_dir}")
    print()

    extract_elements(input_path, output_dir)


if __name__ == '__main__':
    main()
