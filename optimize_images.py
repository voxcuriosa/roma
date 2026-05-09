import os
from PIL import Image

def optimize_webp(file_path, quality=15):
    try:
        img = Image.open(file_path)
        original_size = os.path.getsize(file_path)
        img.save(file_path, "WEBP", quality=quality, method=6)
        new_size = os.path.getsize(file_path)
        reduction = (original_size - new_size) / original_size * 100
        print(f"Optimized {file_path}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% reduction)")
    except Exception as e:
        print(f"Error optimizing {file_path}: {e}")

# Optimize all Lanciani tiles
files = [f for f in os.listdir(".") if f.startswith("lanciani_v5_") and f.endswith(".webp")]
for f in sorted(files):
    optimize_webp(f)
