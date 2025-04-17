import os
import json
import logging
import requests
import time
from typing import Dict, List, Any, Callable, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScriptGenerator:
    def __init__(self):
        logger.info("Initializing ScriptGenerator with Hugging Face")
        # Set up Hugging Face API key
        self.api_key = os.environ.get('HUGGINGFACE_API_KEY')
        if not self.api_key:
            logger.warning("HUGGINGFACE_API_KEY environment variable not set")
            
        # Default model to use
        self.model = os.environ.get('HUGGINGFACE_MODEL', 'mistralai/Mistral-7B-Instruct-v0.2')
        logger.info(f"Using Hugging Face model: {self.model}")
            
        # API endpoint
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
            
        # Headers for API requests
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def generate_script(self, prompt: str, status_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """
        Generate a script based on a prompt using Hugging Face's API.
            
        Args:
            prompt (str): The prompt to generate a script from
            status_callback (callable, optional): Callback to update job status
                
        Returns:
            dict: The generated script
        """
        try:
            logger.info(f"Generating script for prompt: {prompt}")
            
            if status_callback:
                status_callback(
                    status="processing",
                    current_step="Analyzing prompt and preparing script generation",
                    progress=10,
                    step_name="script_generation",
                    step_status="processing",
                    step_progress=10
                )
                
            # Create the prompt for the model
            formatted_prompt = self._format_prompt(prompt)
            
            if status_callback:
                status_callback(
                    status="processing",
                    current_step="Sending request to language model",
                    progress=20,
                    step_name="script_generation",
                    step_status="processing",
                    step_progress=30
                )
                
            # Call the Hugging Face API
            response = self._call_huggingface_api(formatted_prompt, status_callback)
            
            if status_callback:
                status_callback(
                    status="processing",
                    current_step="Processing language model response",
                    progress=40,
                    step_name="script_generation",
                    step_status="processing",
                    step_progress=70
                )
                
            # Parse the response to extract the script
            script = self._parse_response(response, prompt)
            
            if status_callback:
                status_callback(
                    status="processing",
                    current_step="Script generation completed",
                    progress=50,
                    step_name="script_generation",
                    step_status="completed",
                    step_progress=100
                )
                
            logger.info(f"Script generated successfully")
                
            return {
                "status": "success",
                "script": script
            }
        except Exception as e:
            logger.error(f"Error generating script: {e}")
            
            if status_callback:
                status_callback(
                    status="error",
                    current_step="Error in script generation",
                    progress=0,
                    step_name="script_generation",
                    step_status="error",
                    step_progress=0,
                    error=str(e)
                )
                
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _format_prompt(self, prompt: str) -> str:
        """Format the user prompt for the model."""
        return f"""You are a professional video script writer. Create a detailed script for a short video based on the following prompt:

"{prompt}"

The script should include:
1. A title for the video
2. A list of scenes, where each scene has:
   - A detailed description of what happens in the scene
   - The duration of the scene in seconds (between 3-8 seconds)
   - Camera directions (e.g., "wide shot", "close-up", "tracking shot")
   - Any special visual effects or transitions

Format your response as a JSON object with the following structure:
{{
  "title": "Video Title",
  "scenes": [
    {{
      "description": "Detailed description of scene 1",
      "duration": 5,
      "camera": "Wide establishing shot",
      "effects": "Slow fade in"
    }},
    {{
      "description": "Detailed description of scene 2",
      "duration": 7,
      "camera": "Medium close-up",
      "effects": "None"
    }}
  ]
}}

Make sure your response is valid JSON and includes at least 5-8 scenes. The total video duration should be around 30-45 seconds."""
    
    def _call_huggingface_api(self, prompt: str, status_callback: Optional[Callable] = None) -> str:
        """Call the Hugging Face API to generate text."""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True
            }
        }
            
        # Make the API request
        max_retries = 3
        retry_delay = 5
            
        for attempt in range(max_retries):
            try:
                if status_callback:
                    status_callback(
                        status="processing",
                        current_step=f"Calling language model (attempt {attempt+1}/{max_retries})",
                        progress=25 + attempt * 5,
                        step_name="script_generation",
                        step_status="processing",
                        step_progress=30 + attempt * 10
                    )
                    
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=60  # Add timeout to prevent hanging requests
                )
                            
                # Check if the model is still loading
                if response.status_code == 503:
                    logger.warning("Model is still loading. Waiting before retry...")
                    
                    if status_callback:
                        status_callback(
                            status="processing",
                            current_step="Model is still loading, waiting to retry",
                            progress=25 + attempt * 5,
                            step_name="script_generation",
                            step_status="processing",
                            step_progress=30 + attempt * 10,
                            message="The language model is still loading. Waiting before retrying."
                        )
                        
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                            
                # Check for other errors
                response.raise_for_status()
                            
                # Parse the response
                result = response.json()
                            
                # Extract the generated text
                if isinstance(result, list) and len(result) > 0:
                    if "generated_text" in result[0]:
                        return result[0]["generated_text"]
                    else:
                        return result[0]
                elif isinstance(result, dict) and "generated_text" in result:
                    return result["generated_text"]
                else:
                    return str(result)
                        
            except requests.exceptions.RequestException as e:
                logger.error(f"API request failed (attempt {attempt+1}/{max_retries}): {e}")
                
                if status_callback:
                    status_callback(
                        status="processing",
                        current_step=f"API request failed, retrying ({attempt+1}/{max_retries})",
                        progress=25 + attempt * 5,
                        step_name="script_generation",
                        step_status="processing",
                        step_progress=30 + attempt * 10,
                        message=f"API request failed: {str(e)}. Retrying..."
                    )
                    
                if attempt == max_retries - 1:
                    raise
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
    
    def _parse_response(self, response: str, original_prompt: str) -> Dict[str, Any]:
        """Parse the model's response to extract the script."""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx+1]
                script = json.loads(json_str)
                
                # Validate the script structure
                if "title" not in script or "scenes" not in script:
                    raise ValueError("Generated script is missing required fields (title or scenes)")
                
                # Ensure each scene has the required fields
                for i, scene in enumerate(script["scenes"]):
                    if "description" not in scene:
                        scene["description"] = f"Scene {i+1}"
                    if "duration" not in scene:
                        scene["duration"] = 5  # Default duration
                    if "camera" not in scene:
                        scene["camera"] = "Medium shot"
                    if "effects" not in scene:
                        scene["effects"] = "None"
                
                return script
            else:
                # If JSON parsing fails, create a basic script structure
                logger.warning("Could not parse JSON from model response. Creating basic script.")
                return self._create_fallback_script(response, original_prompt)
                
        except json.JSONDecodeError:
            logger.warning("JSON decode error. Creating fallback script.")
            return self._create_fallback_script(response, original_prompt)
        except Exception as e:
            logger.error(f"Error parsing response: {e}")
            return self._create_fallback_script(response, original_prompt)
    
    def _create_fallback_script(self, response: str, original_prompt: str) -> Dict[str, Any]:
        """Create a fallback script when parsing fails."""
        logger.info("Creating fallback script")
        
        # Try to extract scenes from the text response
        scenes = []
        lines = response.split('\n')
        current_scene = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for scene indicators
            if "scene" in line.lower() and ":" in line:
                if current_scene:
                    scenes.append(current_scene)
                current_scene = {
                    "description": line.split(":", 1)[1].strip(),
                    "duration": 5,
                    "camera": "Medium shot",
                    "effects": "None"
                }
            elif current_scene and "duration" in line.lower():
                try:
                    # Try to extract duration
                    duration_str = line.split(":", 1)[1].strip()
                    duration = int(''.join(filter(str.isdigit, duration_str)))
                    if 1 <= duration <= 20:  # Sanity check
                        current_scene["duration"] = duration
                except:
                    pass
            elif current_scene and "camera" in line.lower():
                try:
                    # Try to extract camera direction
                    current_scene["camera"] = line.split(":", 1)[1].strip()
                except:
                    pass
            elif current_scene and "effect" in line.lower():
                try:
                    # Try to extract effects
                    current_scene["effects"] = line.split(":", 1)[1].strip()
                except:
                    pass
            elif current_scene:
                # Add to the current scene description
                current_scene["description"] += " " + line
        
        # Add the last scene if it exists
        if current_scene:
            scenes.append(current_scene)
        
        # If we couldn't extract any scenes, create some basic ones
        if not scenes:
            # Create a basic 5-scene script
            scenes = [
                {
                    "description": f"Scene showing {original_prompt}",
                    "duration": 5,
                    "camera": "Wide shot",
                    "effects": "Fade in"
                },
                {
                    "description": f"Close-up detail of {original_prompt}",
                    "duration": 4,
                    "camera": "Close-up",
                    "effects": "None"
                },
                {
                    "description": f"Another angle of {original_prompt}",
                    "duration": 6,
                    "camera": "Medium shot",
                    "effects": "None"
                },
                {
                    "description": f"Showing the context around {original_prompt}",
                    "duration": 5,
                    "camera": "Wide shot",
                    "effects": "None"
                },
                {
                    "description": f"Final view of {original_prompt}",
                    "duration": 5,
                    "camera": "Tracking shot",
                    "effects": "Fade out"
                }
            ]
        
        # Create the script
        return {
            "title": f"Video about {original_prompt}",
            "scenes": scenes
        }
