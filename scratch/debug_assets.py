import os
local_dir = "assets"
items = os.listdir(local_dir)
print(f"Items in assets: {items}")
for item in items:
    local_path = os.path.join(local_dir, item)
    print(f"Item: {item}, isdir: {os.path.isdir(local_path)}")
