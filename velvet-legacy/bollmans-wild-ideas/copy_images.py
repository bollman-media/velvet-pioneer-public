import shutil
import os

images = [
    ('file:///Users/bollman/.gemini/jetski/brain/f39d8361-0fc0-449f-8e6a-9666af8134cc/mar23_pitch1_theme_1774394614682.png', 'mar23_pitch1_theme.png'),
    ('file:///Users/bollman/.gemini/jetski/brain/f39d8361-0fc0-449f-8e6a-9666af8134cc/vibeverse_black_bg_1774394476866.png', 'vibeverse_black_bg.png'),
    ('file:///Users/bollman/.gemini/jetski/brain/f39d8361-0fc0-449f-8e6a-9666af8134cc/mar23_pitch3_echochains_1774394630236.png', 'mar23_pitch3_echochains.png'),
    ('file:///Users/bollman/.gemini/jetski/brain/f39d8361-0fc0-449f-8e6a-9666af8134cc/mar23_pitch4_beatblend_1774394642267.png', 'mar23_pitch4_beatblend.png'),
    ('file:///Users/bollman/.gemini/jetski/brain/f39d8361-0fc0-449f-8e6a-9666af8134cc/mar23_pitch5_personapulse_1774394659527.png', 'mar23_pitch5_personapulse.png')
]

dest_dir = '/Users/bollman/Documents/Jetski/velvet-pioneer/bollmans-wild-ideas/images/2026-03-23'
os.makedirs(dest_dir, exist_ok=True)

for src_uri, dest_name in images:
    src_path = src_uri.replace('file://', '')
    dest_path = os.path.join(dest_dir, dest_name)
    print(f"Copying {src_path} to {dest_path}")
    shutil.copyfile(src_path, dest_path)

print("Copy complete!")
