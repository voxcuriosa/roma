import numpy as np

# True coordinates (Modern Map)
true_pts = np.array([
    [41.8902, 12.4922], # Colosseum
    [41.9031, 12.4663], # Castel
    [41.9061, 12.4764], # Augustus
    [41.8859, 12.4853]  # Circus
])

# Lanciani coordinates (Currently displayed in v5 bounds)
# Current bounds v5: [41.8717, 12.4402], [41.9137, 12.5254]
lan_pts = np.array([
    [41.890872652587966, 12.491412162780763],
    [41.90352252396124, 12.465877532958986],
    [41.90642910386492, 12.47579097747803],
    [41.88687899456379, 12.484631538391115]
])

# We want to find A, B such that True = A * Current + B
A_lat, B_lat = np.polyfit(lan_pts[:,0], true_pts[:,0], 1)
A_lng, B_lng = np.polyfit(lan_pts[:,1], true_pts[:,1], 1)

def transform(lat, lng):
    return A_lat * lat + B_lat, A_lng * lng + B_lng

# Original bounds v5
# Top: 41.9137, Bottom: 41.8717, Left: 12.4402, Right: 12.5254
new_top = transform(41.9137, 0)[0]
new_bottom = transform(41.8717, 0)[0]
new_left = transform(0, 12.4402)[1]
new_right = transform(0, 12.5254)[1]

print(f"New Calibrated Bounds:")
print(f"Top: {new_top}")
print(f"Bottom: {new_bottom}")
print(f"Left: {new_left}")
print(f"Right: {new_right}")
