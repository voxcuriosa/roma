from PIL import Image
img = Image.open("lanciani_zoom5.png")
crop = img.crop((2250-256, 1424-256, 2250+256, 1424+256))
crop.save("castel_check.png")
