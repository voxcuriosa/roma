import requests
import json
import os
import time

# Create directories
os.makedirs("assets/historical", exist_ok=True)
os.makedirs("data", exist_ok=True)

with open("piranesi_ids.json", "r") as f:
    data = json.load(f)
    ids = data.get("objectIDs", [])

print(f"Found {len(ids)} Piranesi IDs. Starting download of web-optimized versions...")

metadata = []

# To save time and space, we'll limit to a good selection or all if they are small
# Let's try to get all 136 but with the 'small' version
for i, obj_id in enumerate(ids):
    try:
        # Get object info
        response = requests.get(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}", timeout=10)
        obj_data = response.json()
        
        # Use primaryImageSmall for web optimization
        img_url = obj_data.get("primaryImageSmall")
        title = obj_data.get("title", f"Piranesi_{obj_id}")
        
        if img_url:
            filename = f"piranesi_{obj_id}.jpg"
            filepath = os.path.join("assets/historical", filename)
            
            # Download image
            img_res = requests.get(img_url, timeout=15)
            if img_res.status_code == 200:
                with open(filepath, "wb") as img_f:
                    img_f.write(img_res.content)
                
                metadata.append({
                    "id": obj_id,
                    "title": title,
                    "image": f"assets/historical/{filename}"
                })
                print(f"[{i+1}/{len(ids)}] Downloaded: {title}")
            else:
                print(f"[{i+1}/{len(ids)}] Failed to download image for ID {obj_id}")
        else:
            print(f"[{i+1}/{len(ids)}] No image found for ID {obj_id}")
            
        # Small sleep to be nice to the API
        time.sleep(0.1)
        
    except Exception as e:
        print(f"Error processing ID {obj_id}: {e}")

# Save metadata for the JS to use
with open("data/piranesi_metadata.json", "w", encoding="utf-8") as meta_f:
    json.dump(metadata, meta_f, indent=2, ensure_ascii=False)

print("\nFinished! Metadata saved to data/piranesi_metadata.json")
