from PIL import Image
img = Image.open("lanciani_zoom5.png")
crop = img.crop((3368-256, 2809-256, 3368+256, 2809+256))
crop.save("circus_check.png")
