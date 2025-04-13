import os
import json
from PIL import Image, ImageDraw, ImageFont

def generate_assets(script_path, job_dir):
    """
    Generate visual assets based on the script.
    
    Args:
        script_path (str): Path to the script JSON file
        job_dir (str): Directory to save the generated assets
        
    Returns:
        str: Path to the directory containing generated assets
    """
    print(f"Generating assets based on script: {script_path}")
    
    # Load the script
    with open(script_path, 'r') as f:
        script = json.load(f)
    
    # Create assets directory
    assets_dir = os.path.join(job_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    
    # Process each scene and generate appropriate assets
    for scene in script["scenes"]:
        scene_id = scene["scene_id"]
        scene_dir = os.path.join(assets_dir, f"scene_{scene_id}")
        os.makedirs(scene_dir, exist_ok=True)
        
        # Create a placeholder image for the scene
        bg_image = Image.new('RGB', (1920, 1080), color=(73, 109, 137))
        d = ImageDraw.Draw(bg_image)
        
        # Try to load a font, fall back to default if not available
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except IOError:
            font = ImageFont.load_default()
            
        d.text((960, 540), f"Scene {scene_id}: {scene['description']}", 
               fill=(255, 255, 255), anchor="mm", font=font)
        
        bg_path = os.path.join(scene_dir, f"background.png")
        bg_image.save(bg_path)
    
    # Update status
    with open(os.path.join(job_dir, "status.txt"), 'w') as f:
        f.write("assets_generated")
    
    return assets_dir
