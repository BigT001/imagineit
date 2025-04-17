import os
import json
import logging
import time
import uuid
from typing import Dict, List, Any, Optional, Callable
from threading import Lock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobManager:
    """Manages video generation jobs and their statuses."""
    
    def __init__(self, storage_dir: str = "jobs"):
        """
        Initialize the JobManager.
        
        Args:
            storage_dir (str): Directory to store job data
        """
        self.storage_dir = storage_dir
        self.jobs_dir = os.path.join(storage_dir, "jobs")
        self.status_dir = os.path.join(storage_dir, "status")
        self.output_dir = os.path.join(storage_dir, "output")
        
        # Create directories if they don't exist
        for directory in [self.jobs_dir, self.status_dir, self.output_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # Lock for thread safety
        self.lock = Lock()
        
        logger.info(f"JobManager initialized with storage directory: {storage_dir}")
    
    def create_job(self, prompt: str, image_id: Optional[str] = None) -> str:
        """
        Create a new job.
        
        Args:
            prompt (str): The prompt for the video generation
            image_id (str, optional): ID of an uploaded image to use
            
        Returns:
            str: The job ID
        """
        job_id = str(uuid.uuid4())
        
        job_data = {
            "job_id": job_id,
            "prompt": prompt,
            "image_id": image_id,
            "created_at": time.time(),
            "updated_at": time.time(),
            "status": "pending"
        }
        
        # Initialize job status
        initial_status = {
            "status": "pending",
            "progress": 0,
            "current_step": "Job created, waiting to start",
            "steps": [
                {
                    "name": "script_generation",
                    "status": "pending",
                    "progress": 0,
                    "message": "Waiting to start"
                },
                {
                    "name": "asset_generation",
                    "status": "pending",
                    "progress": 0,
                    "message": "Waiting for script generation"
                },
                {
                    "name": "animation",
                    "status": "pending",
                    "progress": 0,
                    "message": "Waiting for animation"
                },
                {
                    "name": "rendering",
                    "status": "pending",
                    "progress": 0,
                    "message": "Waiting for rendering"
                }
            ],
            "output": {}
        }
        
        with self.lock:
            # Save job data
            with open(os.path.join(self.jobs_dir, f"{job_id}.json"), 'w') as f:
                json.dump(job_data, f)
            
            # Save initial status
            with open(os.path.join(self.status_dir, f"{job_id}.json"), 'w') as f:
                json.dump(initial_status, f)
        
        logger.info(f"Created job {job_id} with prompt: {prompt}")
        return job_id
    
    def get_job(self, job_id: str) -> Dict[str, Any]:
        """
        Get job data.
        
        Args:
            job_id (str): The job ID
            
        Returns:
            dict: The job data
        """
        job_path = os.path.join(self.jobs_dir, f"{job_id}.json")
        
        if not os.path.exists(job_path):
            raise ValueError(f"Job {job_id} not found")
        
        with open(job_path, 'r') as f:
            return json.load(f)
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get job status.
        
        Args:
            job_id (str): The job ID
            
        Returns:
            dict: The job status
        """
        status_path = os.path.join(self.status_dir, f"{job_id}.json")
        
        if not os.path.exists(status_path):
            raise ValueError(f"Status for job {job_id} not found")
        
        with open(status_path, 'r') as f:
            return json.load(f)
    
    def list_jobs(self, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        List jobs, sorted by creation time (newest first).
        
        Args:
            limit (int): Maximum number of jobs to return
            offset (int): Number of jobs to skip
            
        Returns:
            list: List of job data
        """
        job_files = [f for f in os.listdir(self.jobs_dir) if f.endswith('.json')]
        
        # Sort by creation time (newest first)
        job_files.sort(key=lambda f: os.path.getmtime(os.path.join(self.jobs_dir, f)), reverse=True)
        
        # Apply pagination
        job_files = job_files[offset:offset + limit]
        
        jobs = []
        for job_file in job_files:
            with open(os.path.join(self.jobs_dir, job_file), 'r') as f:
                job_data = json.load(f)
                
                # Add status summary
                try:
                    status_data = self.get_job_status(job_data["job_id"])
                    job_data["status"] = status_data["status"]
                    job_data["progress"] = status_data["progress"]
                except Exception as e:
                    logger.error(f"Error getting status for job {job_data['job_id']}: {e}")
                    job_data["status"] = "error"
                    job_data["progress"] = 0
                
                jobs.append(job_data)
        
        return jobs
    
    def update_job_status(self, job_id: str, **kwargs) -> Dict[str, Any]:
        """
        Update job status.
        
        Args:
            job_id (str): The job ID
            **kwargs: Status fields to update
            
        Returns:
            dict: The updated job status
        """
        status_path = os.path.join(self.status_dir, f"{job_id}.json")
        
        if not os.path.exists(status_path):
            raise ValueError(f"Status for job {job_id} not found")
        
        with self.lock:
            # Read current status
            with open(status_path, 'r') as f:
                status = json.load(f)
            
            # Update overall status fields
            for key in ["status", "progress", "current_step", "error"]:
                if key in kwargs:
                    status[key] = kwargs[key]
            
            # Update specific step
            if "step_name" in kwargs:
                step_name = kwargs["step_name"]
                step_found = False
                
                for step in status["steps"]:
                    if step["name"] == step_name:
                        step_found = True
                        
                        # Update step fields
                        for key in ["status", "progress", "message"]:
                            step_key = f"step_{key}"
                            if step_key in kwargs:
                                step[key] = kwargs[step_key]
                        
                        break
                
                if not step_found:
                    logger.warning(f"Step {step_name} not found in job {job_id}")
            
            # Update output
            if "output" in kwargs:
                if "output" not in status:
                    status["output"] = {}
                
                for key, value in kwargs["output"].items():
                    status["output"][key] = value
            
            # Save updated status
            with open(status_path, 'w') as f:
                json.dump(status, f)
            
            # Update job data
            job_path = os.path.join(self.jobs_dir, f"{job_id}.json")
            with open(job_path, 'r') as f:
                job_data = json.load(f)
            
            job_data["updated_at"] = time.time()
            job_data["status"] = status["status"]
            
            with open(job_path, 'w') as f:
                json.dump(job_data, f)
        
        logger.info(f"Updated status for job {job_id}: {kwargs}")
        return status
    
    def get_status_update_callback(self, job_id: str) -> Callable:
        """
        Get a callback function for updating job status.
        
        Args:
            job_id (str): The job ID
            
        Returns:
            callable: A callback function for updating job status
        """
        def update_callback(**kwargs):
            return self.update_job_status(job_id, **kwargs)
        
        return update_callback
    
    def save_script(self, job_id: str, script: Dict[str, Any]) -> str:
        """
        Save a generated script.
        
        Args:
            job_id (str): The job ID
            script (dict): The script data
            
        Returns:
            str: Path to the saved script file
        """
        script_dir = os.path.join(self.output_dir, job_id)
        os.makedirs(script_dir, exist_ok=True)
        
        script_path = os.path.join(script_dir, "script.json")
        
        with open(script_path, 'w') as f:
            json.dump(script, f, indent=2)
        
        # Update job status with script output
        self.update_job_status(
            job_id,
            output={"script": script_path}
        )
        
        return script_path
    
    def save_image(self, job_id: str, image_data: bytes, image_index: int) -> str:
        """
        Save a generated image.
        
        Args:
            job_id (str): The job ID
            image_data (bytes): The image data
            image_index (int): The image index
            
        Returns:
            str: Path to the saved image file
        """
        images_dir = os.path.join(self.output_dir, job_id, "images")
        os.makedirs(images_dir, exist_ok=True)
        
        image_path = os.path.join(images_dir, f"{image_index}.png")
        
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # Update job status with image output
        with self.lock:
            status = self.get_job_status(job_id)
            
            if "output" not in status:
                status["output"] = {}
            
            if "images" not in status["output"]:
                status["output"]["images"] = []
            
            if image_path not in status["output"]["images"]:
                status["output"]["images"].append(image_path)
            
            status_path = os.path.join(self.status_dir, f"{job_id}.json")
            with open(status_path, 'w') as f:
                json.dump(status, f)
        
        return image_path
    
    def save_video(self, job_id: str, video_data: bytes) -> str:
        """
        Save a generated video.
        
        Args:
            job_id (str): The job ID
            video_data (bytes): The video data
            
        Returns:
            str: Path to the saved video file
        """
        video_dir = os.path.join(self.output_dir, job_id)
        os.makedirs(video_dir, exist_ok=True)
        
        video_path = os.path.join(video_dir, "output.mp4")
        
        with open(video_path, 'wb') as f:
            f.write(video_data)
        
        # Update job status with video output
        self.update_job_status(
            job_id,
            status="completed",
            progress=100,
            current_step="Video generation completed",
            output={"video": video_path}
        )
        
        return video_path
