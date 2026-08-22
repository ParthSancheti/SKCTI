import os
from PIL import Image
import rembg
import numpy as np

source_path = r'D:\skcti\icons\ChatGPT Image Aug 22, 2026, 02_14_26 PM.png'
original_img = Image.open(source_path).convert('RGBA')

print("Removing background...")
# Remove background
transparent_img = rembg.remove(original_img)

# 1. Save UI Logos (Transparent)
print("Saving UI Logos...")
os.makedirs(r'D:\skcti\public\src', exist_ok=True)
# Save as PNG
transparent_img.save(r'D:\skcti\public\src\logo.png', format="PNG")
transparent_img.save(r'D:\skcti\public\src\logo_dark.png', format="PNG")
# Save as WebP
transparent_img.save(r'D:\skcti\public\src\logo.webp', format="WEBP")

# 2. Save App Icons & Splash (with background)
# The user said "Adding BG Is Also Your Reposisblity Bhai"
# So I should use the transparent image and composite it on a solid background for icons
# Let's use a nice subtle dark background or black, matching the original.
# The original was black (1,1,1). Let's composite it on black, or use original for app icons.
# Using original image is fine, or we can make it a perfectly white background.
# Wait, if I use the original image directly for app icons, the edges will be square. 
# Let's just use the transparent image on a white background, it looks very clean for icons.
print("Creating app icons...")
white_bg = Image.new('RGBA', transparent_img.size, (255, 255, 255, 255))
white_bg.paste(transparent_img, (0, 0), transparent_img)
flat_img_white = white_bg.convert('RGB')

black_bg = Image.new('RGBA', transparent_img.size, (0, 0, 0, 255))
black_bg.paste(transparent_img, (0, 0), transparent_img)
flat_img_black = black_bg.convert('RGB')

# We'll use White BG for regular icon, Black BG for dark icon
os.makedirs(r'D:\skcti\assets', exist_ok=True)
flat_img_white.save(r'D:\skcti\assets\icon.png', format="PNG")
flat_img_white.save(r'D:\skcti\assets\splash.png', format="PNG")

flat_img_black.save(r'D:\skcti\assets\icon-dark.png', format="PNG")
flat_img_black.save(r'D:\skcti\assets\splash-dark.png', format="PNG")

# 3. Generate PWA Icons (WebP format)
print("Generating PWA Icons...")
sizes = [48, 72, 96, 128, 192, 256, 512]
os.makedirs(r'D:\skcti\public\icons', exist_ok=True)

for size in sizes:
    # Use transparent for PWA icons or white background?
    # PWA icons usually look best if they match Android (i.e. background). Or transparent so it floats.
    # Let's use transparent for webp icons! The user complained "All Logo Was Without Logoo Bg", meaning they wanted it transparent everywhere possible, EXCEPT for Capacitor where a BG is required!
    resized = transparent_img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(rf'D:\skcti\icons\icon-{size}.webp', format='WEBP')
    resized.save(rf'D:\skcti\public\icons\icon-{size}.webp', format='WEBP')

print("Done!")
