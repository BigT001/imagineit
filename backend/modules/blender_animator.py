import os
import subprocess
import json
import logging
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BlenderAnimator:
    def __init__(self):
        # Path to Blender executable
        self.blender_path = os.environ.get('BLENDER_PATH', 'blender')
        # Path to Blender script
        self.blender_script_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'blender_scripts', 
            'generate_animation.py'
        )
        
        # Ensure the blender scripts directory exists
        os.makedirs(os.path.dirname(self.blender_script_path), exist_ok=True)
        
        logger.info(f"Initialized BlenderAnimator with Blender path: {self.blender_path}")
        
        # Create the Blender script if it doesn't exist
        if not os.path.exists(self.blender_script_path):
            self._create_blender_script()
    
    def get_blender_version(self):
        """Get the version of Blender installed."""
        try:
            # Run Blender with --version flag
            result = subprocess.run(
                [self.blender_path, '--version'],
                capture_output=True,
                text=True,
                check=True
            )
            
            # Parse the version information
            version_info = result.stdout.strip()
            logger.info(f"Blender version: {version_info}")
            
            return {
                "status": "success",
                "message": version_info
            }
        except subprocess.CalledProcessError as e:
            logger.error(f"Error getting Blender version: {e}")
            return {
                "status": "error",
                "message": f"Error getting Blender version: {str(e)}",
                "stderr": e.stderr if hasattr(e, 'stderr') else None
            }
        except Exception as e:
            logger.error(f"Unexpected error getting Blender version: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }
    
    def create_animation(self, job_dir, script_data, assets_data):
        """
        Create an animation using Blender.
        
        Args:
            job_dir (str): Directory for the job
            script_data (dict): Script data
            assets_data (dict): Assets data
            
        Returns:
            dict: Result of the animation creation
        """
        try:
            logger.info(f"Creating animation in {job_dir}")
            
            # Create a temporary file to store the job configuration
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                # Create the job configuration
                job_config = {
                    "job_dir": job_dir,
                    "script": script_data,
                    "assets": assets_data,
                    "output_file": os.path.join(job_dir, "output.mp4")
                }
                
                # Write the job configuration to the temporary file
                json.dump(job_config, temp_file)
                temp_file_path = temp_file.name
            
            logger.info(f"Job configuration written to {temp_file_path}")
            
            # Run Blender with the script
            logger.info(f"Running Blender with script {self.blender_script_path}")
            
            # Run Blender with the script
            result = subprocess.run(
                [
                    self.blender_path,
                    '--background',
                    '--python', self.blender_script_path,
                    '--', temp_file_path
                ],
                capture_output=True,
                text=True
            )
            
            # Log the Blender output
            logger.info(f"Blender stdout: {result.stdout}")
            if result.stderr:
                logger.error(f"Blender stderr: {result.stderr}")
            
            # Check if Blender ran successfully
            if result.returncode != 0:
                logger.error(f"Blender error (return code {result.returncode}): {result.stderr}")
                return {
                    "status": "error",
                    "error": f"Blender error: {result.stderr}"
                }
            
            # Check if the output file exists
            output_path = os.path.join(job_dir, "output.mp4")
            if not os.path.exists(output_path):
                logger.error(f"Output file not found: {output_path}")
                return {
                    "status": "error",
                    "error": "Blender did not create an output file"
                }
            
            # Clean up the temporary file
            os.unlink(temp_file_path)
            
            return {
                "status": "success",
                "output_path": output_path
            }
        except Exception as e:
            logger.error(f"Error creating animation: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _create_blender_script(self):
        """Create the Blender script for animation generation."""
        script_content = '''
import bpy
import sys
import json
import os

# Get the path to the job configuration file
if "--" in sys.argv:
    argv = sys.argv[sys.argv.index("--") + 1:]
    job_config_path = argv[0]
else:
    print("Error: No job configuration file provided")
    sys.exit(1)

# Load the job configuration
with open(job_config_path, 'r') as f:
    job_config = json.load(f)

# Extract job information
job_dir = job_config["job_dir"]
script_data = job_config["script"]
assets_data = job_config["assets"]
output_file = job_config["output_file"]

print(f"Generating animation for job in {job_dir}")
print(f"Script: {script_data}")
print(f"Assets: {assets_data}")
print(f"Output file: {output_file}")

# Clear the default scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Create a new scene
scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps = 30

# Set up the camera
camera_data = bpy.data.cameras.new(name="Camera")
camera_object = bpy.data.objects.new("Camera", camera_data)
scene.collection.objects.link(camera_object)
scene.camera = camera_object

# Position the camera
camera_object.location = (0, -10, 0)
camera_object.rotation_euler = (1.5708, 0, 0)  # 90 degrees in radians

# Create a light
light_data = bpy.data.lights.new(name="Light", type='SUN')
light_object = bpy.data.objects.new("Light", light_data)
scene.collection.objects.link(light_object)
light_object.location = (0, 0, 5)

# Create a text object with the title
title_data = bpy.data.curves.new(name="Title", type='FONT')
title_data.body = script_data.get("title", "Video")
title_object = bpy.data.objects.new("Title", title_data)
scene.collection.objects.link(title_object)
title_object.location = (0, 0, 2)

# Scale the text
title_object.scale = (0.5, 0.5, 0.5)

# Center the text
title_data.align_x = 'CENTER'

# Set up animation
total_frames = 0
scenes = script_data.get("scenes", [])

if not scenes:
    # Create a default scene if none are provided
    scenes = [{
        "description": script_data.get("prompt", "Default scene"),
        "duration": 5
    }]

# Calculate total duration
total_duration = sum(scene.get("duration", 5) for scene in scenes)
scene.frame_start = 1
scene.frame_end = int(total_duration * scene.render.fps)

print(f"Total duration: {total_duration} seconds ({scene.frame_end} frames)")

# Create a plane for the background
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -1))
background = bpy.context.active_object
background.name = "Background"

# Add a material to the background
background_mat = bpy.data.materials.new(name="BackgroundMaterial")
background_mat.use_nodes = True
background.data.materials.append(background_mat)

# Get the material nodes
nodes = background_mat.node_tree.nodes
links = background_mat.node_tree.links

# Clear default nodes
for node in nodes:
    nodes.remove(node)

# Create new nodes
output_node = nodes.new(type='ShaderNodeOutputMaterial')
emission_node = nodes.new(type='ShaderNodeEmission')
emission_node.inputs[0].default_value = (0.05, 0.05, 0.1, 1.0)  # Dark blue color
emission_node.inputs[1].default_value = 1.0  # Strength

# Link nodes
links.new(emission_node.outputs[0], output_node.inputs[0])

# Create scene text objects
current_frame = 1
for i, scene_data in enumerate(scenes):
    description = scene_data.get("description", f"Scene {i+1}")
    duration = scene_data.get("duration", 5)
    frames = int(duration * scene.render.fps)
    
    print(f"Scene {i+1}: {description} ({duration} seconds, {frames} frames)")
    
    # Create a text object for the scene description
    text_data = bpy.data.curves.new(name=f"Scene{i+1}", type='FONT')
    text_data.body = description
    text_object = bpy.data.objects.new(f"Scene{i+1}", text_data)
    scene.collection.objects.link(text_object)
    
    # Set initial position (off screen)
    text_object.location = (0, 0, -10)
    
    # Scale the text
    text_object.scale = (0.3, 0.3, 0.3)
    
    # Center the text
    text_data.align_x = 'CENTER'
    
    # Animate the text
    # Start: Move in from below
    text_object.location = (0, 0, -2)
    text_object.keyframe_insert(data_path="location", frame=current_frame)
    
      # Middle: Stay in center
    text_object.location = (0, 0, 0)
    text_object.keyframe_insert(data_path="location", frame=current_frame + int(frames * 0.2))
    text_object.keyframe_insert(data_path="location", frame=current_frame + int(frames * 0.8))
    
    # End: Move out to above
    text_object.location = (0, 0, 2)
    text_object.keyframe_insert(data_path="location", frame=current_frame + frames)
    
    # Update current frame
    current_frame += frames

# Hide the title after a few seconds
title_object.keyframe_insert(data_path="location", frame=1)
title_object.keyframe_insert(data_path="location", frame=int(scene.render.fps * 3))  # Show for 3 seconds
title_object.location = (0, 0, 10)  # Move off screen
title_object.keyframe_insert(data_path="location", frame=int(scene.render.fps * 3) + 1)

# Set up rendering
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.filepath = output_file

# Check if there are any images in the assets
if assets_data and "images" in assets_data and assets_data["images"]:
    print(f"Found {len(assets_data['images'])} images in assets")
    
    # Try to add the first image as a texture
    try:
        image_path = assets_data["images"][0]
        if os.path.exists(image_path):
            print(f"Adding image: {image_path}")
            
            # Create a plane for the image
            bpy.ops.mesh.primitive_plane_add(size=5, location=(0, 5, 0))
            image_plane = bpy.context.active_object
            image_plane.name = "ImagePlane"
            
            # Add a material to the plane
            image_mat = bpy.data.materials.new(name="ImageMaterial")
            image_mat.use_nodes = True
            image_plane.data.materials.append(image_mat)
            
            # Get the material nodes
            nodes = image_mat.node_tree.nodes
            links = image_mat.node_tree.links
            
            # Clear default nodes
            for node in nodes:
                nodes.remove(node)
            
            # Create new nodes
            output_node = nodes.new(type='ShaderNodeOutputMaterial')
            emission_node = nodes.new(type='ShaderNodeEmission')
            texture_node = nodes.new(type='ShaderNodeTexImage')
            
            # Load the image
            texture_node.image = bpy.data.images.load(image_path)
            
            # Link nodes
            links.new(texture_node.outputs[0], emission_node.inputs[0])
            links.new(emission_node.outputs[0], output_node.inputs[0])
            
            # Animate the image plane
            image_plane.keyframe_insert(data_path="location", frame=1)
            image_plane.location = (0, 5, 0)
            image_plane.keyframe_insert(data_path="location", frame=scene.frame_end)
    except Exception as e:
        print(f"Error adding image: {e}")

# Render the animation
print("Starting render...")
bpy.ops.render.render(animation=True)

print(f"Animation rendered to {output_file}")
'''
        
        # Create the directory if it doesn't exist
        os.makedirs(os.path.dirname(self.blender_script_path), exist_ok=True)
        
        # Write the script
        with open(self.blender_script_path, 'w') as f:
            f.write(script_content)
        
        logger.info(f"Created Blender script at {self.blender_script_path}")

