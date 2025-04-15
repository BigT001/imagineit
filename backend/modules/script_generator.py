import os
import json
import logging
import requests
import time
from typing import Dict, List, Any

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
    
    def generate_script(self, prompt: str) -> Dict[str, Any]:
        """
        Generate a script based on a prompt using Hugging Face's API.
        
        Args:
            prompt (str): The prompt to generate a script from
            
        Returns:
            dict: The generated script
        """
        try:
            logger.info(f"Generating script for prompt: {prompt}")
            
            # Create the prompt for the model
            formatted_prompt = self._format_prompt(prompt)
            
            # Call the Hugging Face API
            response = self._call_huggingface_api(formatted_prompt)
            
            # Parse the response to extract the script
            script = self._parse_response(response, prompt)
            
            logger.info(f"Script generated successfully")
            
            return {
                "status": "success",
                "script": script
            }
        except Exception as e:
            logger.error(f"Error generating script: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _format_prompt(self, prompt: str) -> str:
        """Format the user prompt for the model."""
        return f"""
You are a professional video script writer. Create a detailed script for a short video based on the following prompt:

"{prompt}"

The script should include:
1. A title for the video
2. A list of scenes, where each scene has:
   - A detailed description of what happens in the scene
   - The duration of the scene in seconds (between 10-20 seconds)

Format your response as a JSON object with the following structure:
{{
  "title": "Video Title",
  "scenes": [
    {{
      "description": "Detailed description of scene 1",
      "duration": 5
    }},
    {{
      "description": "Detailed description of scene 2",
      "duration": 7
    }}
  ]
}}

Make sure your response is valid JSON and includes at least 5 -10 scenes.
"""
    
    def _call_huggingface_api(self, prompt: str) -> str:
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
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload
                )
                
                # Check if the model is still loading
                if response.status_code == 503:
                    logger.warning("Model is still loading. Waiting before retry...")
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
                if attempt == max_retries - 1:
                    raise
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
    
    def _parse_response(self, response: str, original_prompt: str) -> Dict[str, Any]:
        """Parse the model's response to extract the script."""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                script = json.loads(json_str)
                
                # Validate the script structure
                if "title" not in script:
                    script["title"] = self._extract_title(original_prompt)
                
                if "scenes" not in script or not script["scenes"]:
                    script["scenes"] = self._create_default_scenes(original_prompt)
                
                # Add the original prompt
                script["prompt"] = original_prompt
                
                return script
            else:
                # If no JSON found, create a default script
                logger.warning("No valid JSON found in the response. Creating default script.")
                return {
                    "title": self._extract_title(original_prompt),
                    "prompt": original_prompt,
                    "scenes": self._create_default_scenes(original_prompt)
                }
        except json.JSONDecodeError:
            # If JSON parsing fails, create a default script
            logger.warning("Failed to parse JSON from response. Creating default script.")
            return {
                "title": self._extract_title(original_prompt),
                "prompt": original_prompt,
                "scenes": self._create_default_scenes(original_prompt)
            }
    
    def _extract_title(self, prompt: str) -> str:
        """Extract a title from the prompt."""
        # Take the first sentence or up to 50 characters
        title = prompt.split('.')[0].strip()
        if len(title) > 50:
            title = title[:47] + "..."
        return title
    
    def _create_default_scenes(self, prompt: str) -> List[Dict[str, Any]]:
        """Create default scenes from the prompt."""
    def _create_default_scenes(self, prompt: str) -> List[Dict[str, Any]]:
        """Create default scenes from the prompt."""
        # Split the prompt into sentences
        sentences = [s.strip() for s in prompt.split('.') if s.strip()]
        
        # Create scenes from sentences
        scenes = []
        for i, sentence in enumerate(sentences[:5]):  # Limit to 5 scenes
            if not sentence:
                continue
                
            scenes.append({
                "description": sentence,
                "duration": 5  # Default duration
            })
        
        # If no scenes were created, create a default one
        if not scenes:
            scenes.append({
                "description": prompt,
                "duration": 5
            })
        
        return scenes
