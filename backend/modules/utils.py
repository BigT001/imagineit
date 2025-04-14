import os
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ensure_directory_exists(directory_path):
    """
    Ensure that a directory exists, creating it if necessary.
    
    Args:
        directory_path (str): Path to the directory
        
    Returns:
        str: Path to the directory
    """
    os.makedirs(directory_path, exist_ok=True)
    return directory_path

def load_json_file(file_path):
    """
    Load a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        dict: Contents of the JSON file, or None if the file doesn't exist or is invalid
    """
    try:
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading JSON file {file_path}: {e}")
        return None

def save_json_file(file_path, data):
    """
    Save data to a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        data (dict): Data to save
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Error saving JSON file {file_path}: {e}")
        return False
