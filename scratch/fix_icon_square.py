from PIL import Image, ImageOps

def make_perfect_square():
    v4_path = "assets/icons/icon-video-v4.png"
    v4 = Image.open(v4_path).convert("RGB")
    
    # Target size 128x128
    size = (128, 128)
    v4 = v4.resize(size, Image.Resampling.LANCZOS)
    
    # Create a SOLID DARK RED background
    bg_color = (134, 2, 0)
    final_img = Image.new("RGB", size, bg_color)
    
    # Create a mask for the VERY white camera only
    # Thresholding at 250 to avoid the greyish background of the generated image
    mask = ImageOps.grayscale(v4).point(lambda p: 255 if p > 250 else 0)
    
    # Paste the white camera onto the final red image
    white_img = Image.new("RGB", size, (255, 255, 255))
    final_img.paste(white_img, (0, 0), mask)
    
    # Save as v5. RGB format = NO transparency = PERFECT SQUARE.
    final_img.save("assets/icons/icon-video-v5.png")
    print("Created assets/icons/icon-video-v5.png (Perfect Sharp Square via Strict Mask)")

if __name__ == "__main__":
    make_perfect_square()
