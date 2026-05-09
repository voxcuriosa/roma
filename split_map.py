import os
from PIL import Image
import math

# Configuration
ZOOM = 7
OUTPUT_PREFIX = "lanciani_part"

# Extent info
MAX_WIDTH = 30000
MAX_HEIGHT = 19624
TILE_SIZE = 256
COLS = math.ceil(MAX_WIDTH / TILE_SIZE)
ROWS = math.ceil(MAX_HEIGHT / TILE_SIZE)

# Split into 2x2 sectors
SECTOR_COLS = math.ceil(COLS / 2)
SECTOR_ROWS = math.ceil(ROWS / 2)

print(f"Splitting 30000x19624 map into 4 sectors...")

def assemble_sector(start_col, end_col, start_row, end_row, suffix):
    w = (end_col - start_col) * TILE_SIZE
    h = (end_row - start_row) * TILE_SIZE
    sector_img = Image.new('RGB', (w, h), (255, 255, 255))
    
    count = 0
    for y in range(start_row, end_row):
        for x in range(start_col, end_col):
            tile_filename = f"tiles_z7/{x}_{y}.png"
            if os.path.exists(tile_filename):
                try:
                    tile = Image.open(tile_filename).convert('RGBA')
                    sector_img.paste(tile, ((x - start_col) * TILE_SIZE, (y - start_row) * TILE_SIZE), tile)
                    count += 1
                except:
                    pass
    
    filename = f"{OUTPUT_PREFIX}_{suffix}.jpg"
    sector_img.save(filename, quality=85, optimize=True)
    print(f"Saved {filename} ({count} tiles)")

# NW
assemble_sector(0, SECTOR_COLS, 0, SECTOR_ROWS, "nw")
# NE
assemble_sector(SECTOR_COLS, COLS, 0, SECTOR_ROWS, "ne")
# SW
assemble_sector(0, SECTOR_COLS, SECTOR_ROWS, ROWS, "sw")
# SE
assemble_sector(SECTOR_COLS, COLS, SECTOR_ROWS, ROWS, "se")

print("Splitting complete!")
