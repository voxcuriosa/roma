import os
import requests
from PIL import Image
import math
from concurrent.futures import ThreadPoolExecutor

# Configuration
ZOOM = 7  # Back to MAX resolution
BASE_URL = f"https://mappingrome.com/formaurbis/{ZOOM}/"
OUTPUT_FILE = "lanciani_final.jpg" 

# Extent and Resolution info from source
MAX_WIDTH = 30000
MAX_HEIGHT = 19624
RESOLUTION = math.pow(2, 7 - ZOOM) # 1.0 for zoom 7

WIDTH = int(MAX_WIDTH / RESOLUTION)
HEIGHT = int(MAX_HEIGHT / RESOLUTION)

TILE_SIZE = 256
COLS = math.ceil(WIDTH / TILE_SIZE)
ROWS = math.ceil(HEIGHT / TILE_SIZE)

print(f"Target Image Size: {WIDTH}x{HEIGHT}")
print(f"Grid Size: {COLS} columns x {ROWS} rows ({COLS * ROWS} tiles)")

# Ensure tiles directory exists
os.makedirs(f"tiles_z{ZOOM}", exist_ok=True)

def download_tile(coord):
    x, y = coord
    tile_filename = f"tiles_z{ZOOM}/{x}_{y}.png"
    url = f"{BASE_URL}{x}/{y}.png"
    
    if os.path.exists(tile_filename):
        return True
        
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(tile_filename, 'wb') as f:
                f.write(response.content)
            return True
        return False
    except:
        return False

# Download tiles in parallel
coords = [(x, y) for y in range(ROWS) for x in range(COLS)]
print(f"Downloading tiles for Zoom {ZOOM}...")
with ThreadPoolExecutor(max_workers=50) as executor:
    list(executor.map(download_tile, coords))

print(f"Assembling image with RGBA handling for perfect WHITE background...")

# Create target image with WHITE background
full_image = Image.new('RGB', (WIDTH, HEIGHT), (255, 255, 255))
success_count = 0

for y in range(ROWS):
    for x in range(COLS):
        tile_filename = f"tiles_z{ZOOM}/{x}_{y}.png"
        if os.path.exists(tile_filename):
            try:
                # Convert to RGBA to handle transparency correctly
                tile = Image.open(tile_filename).convert('RGBA')
                # Use tile as its own mask to preserve transparency over the white background
                full_image.paste(tile, (x * TILE_SIZE, y * TILE_SIZE), tile)
                success_count += 1
            except Exception as e:
                pass

print(f"Successfully processed {success_count} tiles.")
# Save as JPG with high quality
full_image.save(OUTPUT_FILE, quality=90, optimize=True)
print(f"Saved final high-res image to {OUTPUT_FILE}")
