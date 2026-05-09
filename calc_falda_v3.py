import numpy as np

# True coordinates (Modern Map)
true_pts = np.array([
    [41.8902, 12.4922], # Colosseum
    [41.9031, 12.4663], # Castel
    [41.9061, 12.4764], # Augustus
    [41.8859, 12.4853]  # Circus
])

# Falda v3 coordinates (current bounds: [41.8624, 12.4385], [41.9052, 12.5181])
fal_pts = np.array([
    [41.88065, 12.48884],
    [41.89538, 12.46596],
    [41.89573, 12.47893],
    [41.87771, 12.47862]
])

A_lat, B_lat = np.polyfit(fal_pts[:,0], true_pts[:,0], 1)
A_lng, B_lng = np.polyfit(fal_pts[:,1], true_pts[:,1], 1)

def transform(lat, lng):
    return A_lat * lat + B_lat, A_lng * lng + B_lng

# Original bounds v3
# MinLat: 41.8624, MaxLat: 41.9052, MinLng: 12.4385, MaxLng: 12.5181
new_top = transform(41.9052, 0)[0]
new_bottom = transform(41.8624, 0)[0]
new_left = transform(0, 12.4385)[1]
new_right = transform(0, 12.5181)[1]

print(f"New Calibrated Falda Bounds (Rotated v3):")
print(f"Top: {new_top}")
print(f"Bottom: {new_bottom}")
print(f"Left: {new_left}")
print(f"Right: {new_right}")
