import numpy as np

# True coordinates (Modern Map)
true_pts = np.array([
    [41.8902, 12.4922], # Colosseum
    [41.9031, 12.4663], # Castel
    [41.9061, 12.4764], # Augustus
    [41.8859, 12.4853]  # Circus
])

# Lanciani coordinates (Currently displayed in v4 bounds)
# Current bounds v4: NW: [[41.88955, 12.42755], [41.91725, 12.4923]]
# Total Bounds: [[41.86255, 12.42755], [41.91725, 12.55705]]
# Pixel size: 30208 x 19712

# User's measurements (where the points are ON THE IMAGE right now)
lan_pts = np.array([
    [41.88648014068725, 12.506797249648976],
    [41.9034588561726, 12.46731519256459],
    [41.9074034053347, 12.482678862634026],
    [41.88124026552363, 12.495875312151647]
])

# We want to find A, B such that True = A * Current + B
# Lat fit
A_lat, B_lat = np.polyfit(lan_pts[:,0], true_pts[:,0], 1)
# Lng fit
A_lng, B_lng = np.polyfit(lan_pts[:,1], true_pts[:,1], 1)

print(f"Lat Transform: TrueLat = {A_lat} * LanLat + {B_lat}")
print(f"Lng Transform: TrueLng = {A_lng} * LanLng + {B_lng}")

# Current Corners
# Top Left: [41.91725, 12.42755]
# Bottom Right: [41.86255, 12.55705]

def transform(lat, lng):
    return A_lat * lat + B_lat, A_lng * lng + B_lng

new_tl = transform(41.91725, 12.42755)
new_br = transform(41.86255, 12.55705)

print(f"New Top Left: {new_tl}")
print(f"New Bottom Right: {new_br}")

# Mid points for splitting
mid_lat = transform(41.88955, 12.42755)[0] # Using the mid-lat from original split
mid_lng = transform(41.88955, 12.4923)[1]

print(f"New Mid Lat: {mid_lat}")
print(f"New Mid Lng: {mid_lng}")
