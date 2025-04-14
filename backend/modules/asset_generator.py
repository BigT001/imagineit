import os
import json
import logging
import requests
import base64
import time
from io import BytesIO
from PIL import Image
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssetGenerator:
    def __init__(self):
        logger.info("Initializing AssetGenerator with Stability AI")
        # Set up Stability AI API key
        self.api_key = os.environ.get('STABILITY_API_KEY')
        if not self.api_key:
            logger.warning("STABILITY_API_KEY environment variable not set")
        
        # API endpoint for Stability AI
        self.api_url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
        
        # Headers for API requests
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def generate_assets(self, job_dir: str, script: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate assets for a script using Stability AI.
        
        Args:
            job_dir (str): Directory for the job
            script (dict): The script to generate assets for
            
        Returns:
            dict: The generated assets
        """
        try:
            logger.info(f"Generating assets for job in {job_dir}")
            
            # Create assets directory
            assets_dir = os.path.join(job_dir, "assets")
            os.makedirs(assets_dir, exist_ok=True)
            
            # Create directories for different asset types
            images_dir = os.path.join(assets_dir, "images")
            audio_dir = os.path.join(assets_dir, "audio")
            models_dir = os.path.join(assets_dir, "models")
            
            os.makedirs(images_dir, exist_ok=True)
            os.makedirs(audio_dir, exist_ok=True)
            os.makedirs(models_dir, exist_ok=True)
            
            # Generate images for each scene
            image_paths = self._generate_images(images_dir, script)
            
            # For now, we're not generating audio or 3D models
            audio_paths = []
            model_paths = []
            
            # Create assets metadata
            assets = {
                "images": image_paths,
                "audio": audio_paths,
                "models": model_paths
            }
            
            # Save assets metadata
            assets_path = os.path.join(job_dir, "assets.json")
            with open(assets_path, 'w') as f:
                json.dump(assets, f, indent=2)
            
            logger.info(f"Assets generated and saved to {assets_path}")
            
            return {
                "status": "success",
                "assets": assets
            }
        except Exception as e:
            logger.error(f"Error generating assets: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _generate_images(self, images_dir: str, script: Dict[str, Any]) -> List[str]:
        """Generate images for each scene using Stability AI."""
        logger.info("Generating images with Stability AI")
        
        image_paths = []
        scenes = script.get("scenes", [])
        
        # Generate an image for each scene
        for i, scene in enumerate(scenes):
            try:
                # Get the scene description
                description = scene.get("description", "")
                
                # Generate a prompt for the image
                prompt = f"Create a high-quality image for a video scene: {description}"
                
                logger.info(f"Generating image for scene {i+1}: {description[:50]}...")
                
                # Generate the image
                image_data = self._generate_image_with_stability(prompt)
                
                if image_data:
                    # Save the image
                    image_name = f"scene_{i+1}.png"
                    image_path = os.path.join(images_dir, image_name)
                    
                    with open(image_path, "wb") as f:
                        f.write(image_data)
                    
                    logger.info(f"Image saved to {image_path}")
                    image_paths.append(image_path)
                else:
                    logger.warning(f"Failed to generate image for scene {i+1}")
            except Exception as e:
                logger.error(f"Error generating image for scene {i+1}: {e}")
        
        return image_paths
    
    def _generate_image_with_stability(self, prompt: str) -> bytes:
        """Generate an image using Stability AI API."""
        if not self.api_key:
            logger.error("Stability AI API key not set")
            return None
        
        try:
            # Prepare the request payload
            payload = {
                "text_prompts": [
                    {
                        "text": prompt,
                        "weight": 1.0
                    }
                ],
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30
            }
            
            # Make the API request
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload
            )
            
            # Check for errors
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Extract the image data
            if "artifacts" in result and len(result["artifacts"]) > 0:
                image_base64 = result["artifacts"][0]["base64"]
                return base64.b64decode(image_base64)
            else:
                logger.error("No image data in response")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error generating image: {e}")
            return None
