import numpy as np

# True coordinates (Modern Map)
true_pts = np.array([
    [41.8902, 12.4922], # Colosseum
    [41.9031, 12.4663], # Castel
    [41.9061, 12.4764], # Augustus
    [41.8859, 12.4853]  # Circus
])

# Falda v3 LATEST coordinates from user
fal_pts = np.array([
    [41.88958, 12.49208],
    [41.90400, 12.46614],
    [41.90477, 12.48092],
    [41.88662, 12.48068]
])

A_lat, B_lat = np.polyfit(fal_pts[:,0], true_pts[:,0], 1)
A_lng, B_lng = np.polyfit(fal_pts[:,1], true_pts[:,1], 1)

def transform(lat, lng):
    return A_lat * lat + B_lat, A_lng * lng + B_lng

# Current v3 bounds in script.js:
# MinLat: 41.8709, MaxLat: 41.9145, MinLng: 12.4354, MaxLng: 12.5251
new_top = transform(41.9145, 0)[0]
new_bottom = transform(41.8709, 0)[0]
new_left = transform(0, 12.4354)[1]
new_right = transform(0, 12.5251)[1]

print(f"Final Calibrated Falda Bounds:")
print(f"Top: {new_top}")
print(f"Bottom: {new_bottom}")
print(f"Left: {new_left}")
print(f"Right: {new_right}")
