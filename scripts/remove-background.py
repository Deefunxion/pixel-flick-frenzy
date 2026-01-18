#!/usr/bin/env python3
"""
Background Remover - Converts background color to transparency
Optimized for hand-drawn UI elements with white/beige backgrounds
"""

import os
import sys
from PIL import Image
import numpy as np
from collections import Counter


def get_background_color(data, sample_size=20):
    """Detect background by sampling corners."""
    h, w = data.shape[:2]
    samples = []

    corners = [
        data[0:sample_size, 0:sample_size],
        data[0:sample_size, w-sample_size:w],
        data[h-sample_size:h, 0:sample_size],
        data[h-sample_size:h, w-sample_size:w],
    ]

    for corner in corners:
        for row in corner:
            for pixel in row:
                samples.append(tuple(pixel[:3]))

    counter = Counter(samples)
    return counter.most_common(1)[0][0]


def remove_background(input_path, output_path, threshold=25, feather=True):
    """
    Remove background from image, replacing with transparency.

    Args:
        input_path: Source image
        output_path: Output PNG with transparency
        threshold: Color distance threshold (higher = more aggressive removal)
        feather: If True, creates smooth edges based on color distance
    """
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Detect background color
    bg_color = get_background_color(data)
    print(f"  Background: RGB{bg_color}")

    # Calculate distance from background for each pixel
    rgb = data[:, :, :3].astype(np.float32)
    bg = np.array(bg_color, dtype=np.float32)

    # Euclidean distance
    distance = np.sqrt(np.sum((rgb - bg) ** 2, axis=2))

    if feather:
        # Smooth alpha based on distance (closer to bg = more transparent)
        # Map distance to alpha: 0 at threshold/2, 255 at threshold*2
        alpha = np.clip((distance - threshold * 0.5) / (threshold * 1.5) * 255, 0, 255)
        alpha = alpha.astype(np.uint8)
    else:
        # Hard cutoff
        alpha = np.where(distance > threshold, 255, 0).astype(np.uint8)

    # Apply new alpha channel
    data[:, :, 3] = alpha

    # Save result
    result = Image.fromarray(data)
    result.save(output_path)

    return True


def process_directory(input_dir, output_dir, threshold=25):
    """Process all PNGs in a directory."""
    os.makedirs(output_dir, exist_ok=True)

    files = [f for f in os.listdir(input_dir) if f.lower().endswith('.png')]
    print(f"Processing {len(files)} images...")
    print(f"Threshold: {threshold}")
    print()

    for filename in sorted(files):
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)

        print(f"Processing: {filename}")
        try:
            remove_background(input_path, output_path, threshold)
            print(f"  Saved: {output_path}")
        except Exception as e:
            print(f"  Error: {e}")

    print(f"\nDone! Output in: {output_dir}")


def main():
    if len(sys.argv) < 2:
        input_dir = 'public/assets/ui/elements/selection_ui_assets'
    else:
        input_dir = sys.argv[1]

    if len(sys.argv) < 3:
        output_dir = input_dir + '_transparent'
    else:
        output_dir = sys.argv[2]

    # Optional threshold argument
    threshold = int(sys.argv[3]) if len(sys.argv) > 3 else 25

    if os.path.isfile(input_dir):
        # Single file mode
        os.makedirs(os.path.dirname(output_dir) or '.', exist_ok=True)
        print(f"Processing single file: {input_dir}")
        remove_background(input_dir, output_dir, threshold)
    else:
        # Directory mode
        process_directory(input_dir, output_dir, threshold)


if __name__ == '__main__':
    main()
