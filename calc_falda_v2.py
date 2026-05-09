import numpy as np

# True coordinates (Modern Map)
true_pts = np.array([
    [41.8902, 12.4922], # Colosseum
    [41.9031, 12.4663], # Castel
    [41.9061, 12.4764], # Augustus
    [41.8859, 12.4853]  # Circus
])

# Falda coordinates (v1 current bounds: [41.8706, 12.4500], [41.9130, 12.5300])
fal_pts = np.array([
    [41.89734192757194, 12.495617866516115],
    [41.88560153307071, 12.468194961547853],
    [41.89799677038854, 12.467808723449709],
    [41.891959184635986, 12.501239776611328]
])

A_lat, B_lat = np.polyfit(fal_pts[:,0], true_pts[:,0], 1)
A_lng, B_lng = np.polyfit(fal_pts[:,1], true_pts[:,1], 1)

def transform(lat, lng):
    return A_lat * lat + B_lat, A_lng * lng + B_lng

# Original bounds v1
# Top: 41.9130, Bottom: 41.8706, Left: 12.4500, Right: 12.5300
new_top = transform(41.9130, 0)[0]
new_bottom = transform(41.8706, 0)[0]
new_left = transform(0, 12.4500)[1]
new_right = transform(0, 12.5300)[1]

print(f"New Calibrated Falda Bounds:")
print(f"Top: {new_top}")
print(f"Bottom: {new_bottom}")
print(f"Left: {new_left}")
print(f"Right: {new_right}")
