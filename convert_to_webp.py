import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

files = ["lanciani_part_nw.jpg", "lanciani_part_ne.jpg", "lanciani_part_sw.jpg", "lanciani_part_se.jpg"]

for f in files:
    if os.path.exists(f):
        print(f"Converting {f} to webp...")
        img = Image.open(f)
        img.save(f.replace(".jpg", ".webp"), "WEBP", quality=60, optimize=True)
        print(f"Done: {f.replace('.jpg', '.webp')}")
