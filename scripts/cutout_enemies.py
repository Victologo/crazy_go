import os
from PIL import Image, ImageFilter
from collections import deque

def remove_solid_white_bg(input_path, output_path, threshold=242):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    # Visited grid for flood fill
    visited = [[False for _ in range(h)] for _ in range(w)]
    queue = deque()

    # Push all border pixels that are near white
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b, _ = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                queue.append((x, y))
                visited[x][y] = True
                
    for y in range(h):
        for x in [0, w - 1]:
            if not visited[x][y]:
                r, g, b, _ = pixels[x, y]
                if r >= threshold and g >= threshold and b >= threshold:
                    queue.append((x, y))
                    visited[x][y] = True

    # Flood fill outer background
    while queue:
        cx, cy = queue.popleft()
        pixels[cx, cy] = (255, 255, 255, 0) # Make transparent

        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                r, g, b, a = pixels[nx, ny]
                if r >= threshold and g >= threshold and b >= threshold:
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    # Anti-alias edges slightly (feathering)
    alpha = img.split()[-1]
    smoothed_alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.7))
    img.putalpha(smoothed_alpha)

    # Save PNG
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

artifact_dir = r"C:\Users\VICTOR\.gemini\antigravity\brain\36c855c2-ebe4-45d6-aa7d-8a543d48b90f"
dest_dir = r"c:\Users\VICTOR\Desktop\crazy_go\public\enemies"

# Find latest generated images
daiki_src = os.path.join(artifact_dir, "monk_young_daiki_1786791065289.jpg")
hiroshi_src = os.path.join(artifact_dir, "sage_master_hiroshi_1786791080905.jpg")
peaceful_src = os.path.join(artifact_dir, "monk_novice_peaceful_1786791097403.jpg")
elder_src = os.path.join(artifact_dir, "sage_elder_master_1786791112725.jpg")

# Process monk_4 (Daiki) and monk_2
remove_solid_white_bg(daiki_src, os.path.join(dest_dir, "monk_4.png"))
remove_solid_white_bg(daiki_src, os.path.join(dest_dir, "monk_2.png"))

# Process sage_1 (Hiroshi / Kenshin) and sage
remove_solid_white_bg(hiroshi_src, os.path.join(dest_dir, "sage_1.png"))
remove_solid_white_bg(hiroshi_src, os.path.join(dest_dir, "sage.png"))

# Process monk (Default), monk_1, monk_3, monk_5
remove_solid_white_bg(peaceful_src, os.path.join(dest_dir, "monk.png"))
remove_solid_white_bg(peaceful_src, os.path.join(dest_dir, "monk_1.png"))
remove_solid_white_bg(peaceful_src, os.path.join(dest_dir, "monk_3.png"))
remove_solid_white_bg(peaceful_src, os.path.join(dest_dir, "monk_5.png"))

# Process sage_2, sage_3, sage_4, sage_5
remove_solid_white_bg(elder_src, os.path.join(dest_dir, "sage_2.png"))
remove_solid_white_bg(elder_src, os.path.join(dest_dir, "sage_3.png"))
remove_solid_white_bg(elder_src, os.path.join(dest_dir, "sage_4.png"))
remove_solid_white_bg(elder_src, os.path.join(dest_dir, "sage_5.png"))

print("All enemy monk and sage images cut out successfully!")
