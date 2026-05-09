from PIL import Image
img = Image.open("lanciani_zoom5.png")
# Center of the image is roughly 3750, 2453
# Colosseum should be slightly right and down from the center of the city, 
# but Lanciani's map is centered on the whole city.
crop = img.crop((3750-256, 2500-256, 3750+256, 2500+256))
crop.save("colosseum_check.png")
