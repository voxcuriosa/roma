import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

# Configuration
INPUT_FILE = "assets/falda/falda.jpg"
OUTPUT_PREFIX = "falda_hd"

if not os.path.exists(INPUT_FILE):
    print(f"Error: {INPUT_FILE} not found.")
    exit(1)

img = Image.open(INPUT_FILE)
w, h = img.size
mid_w = w // 2
mid_h = h // 2

sectors = [
    ("nw", (0, 0, mid_w, mid_h)),
    ("ne", (mid_w, 0, w, mid_h)),
    ("sw", (0, mid_h, mid_w, h)),
    ("se", (mid_w, mid_h, w, h))
]

print(f"Splitting {w}x{h} Falda map into 4 sectors...")

for suffix, box in sectors:
    sector = img.crop(box)
    filename = f"{OUTPUT_PREFIX}_{suffix}.webp"
    sector.save(filename, "WEBP", quality=80, optimize=True)
    print(f"Saved {filename}")

print("Falda HD split complete!")
