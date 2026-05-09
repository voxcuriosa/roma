from PIL import Image
img = Image.open("lanciani_zoom5.png")
crop = img.crop((3000-256, 800-256, 3000+256, 800+256))
crop.save("augustus_check.png")
