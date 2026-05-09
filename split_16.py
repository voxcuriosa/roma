import os
from PIL import Image
import math

Image.MAX_IMAGE_PIXELS = None

# Configuration
ZOOM = 7
OUTPUT_PREFIX = "lanciani_v5"

# The 4 big JPGs I made earlier are the best source to split further
# Or I can re-assemble from tiles_z7 which is safer
MAX_WIDTH = 30000
MAX_HEIGHT = 19624
TILE_SIZE = 256
COLS = math.ceil(MAX_WIDTH / TILE_SIZE)
ROWS = math.ceil(MAX_HEIGHT / TILE_SIZE)

# Split into 4x4 sectors (16 parts)
DIVS = 4
S_COLS = math.ceil(COLS / DIVS)
S_ROWS = math.ceil(ROWS / DIVS)

print(f"Splitting 30000x19624 map into 16 sectors...")

for r in range(DIVS):
    for c in range(DIVS):
        start_col = c * S_COLS
        end_col = min((c + 1) * S_COLS, COLS)
        start_row = r * S_ROWS
        end_row = min((r + 1) * S_ROWS, ROWS)
        
        w = (end_col - start_col) * TILE_SIZE
        h = (end_row - start_row) * TILE_SIZE
        
        sector_img = Image.new('RGB', (w, h), (255, 255, 255))
        
        for y in range(start_row, end_row):
            for x in range(start_col, end_col):
                tile_filename = f"tiles_z7/{x}_{y}.png"
                if os.path.exists(tile_filename):
                    try:
                        tile = Image.open(tile_filename).convert('RGBA')
                        sector_img.paste(tile, ((x - start_col) * TILE_SIZE, (y - start_row) * TILE_SIZE), tile)
                    except:
                        pass
        
        filename = f"{OUTPUT_PREFIX}_{r}_{c}.webp"
        sector_img.save(filename, "WEBP", quality=60, optimize=True)
        print(f"Saved {filename}")

print("16-way split complete!")
