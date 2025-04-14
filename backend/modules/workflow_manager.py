import os
import json
import time
import uuid
import logging
from modules.script_generator import generate_script
from modules.asset_generator import generate_assets
from modules.blender_animator import create_animation
from modules.audio_generator import generate_audio
from modules.publisher import publish_to_platforms
from backend.modules.utils import update_job_status, logger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VideoGenerationWorkflow:
    """
    Manages the workflow for video generation.
    This is a placeholder class that can be expanded later.
    """
    
    def __init__(self, jobs_dir="jobs"):
        """
        Initialize the workflow manager.
        
        Args:
            jobs_dir (str): Directory to store job data
        """
        self.jobs_dir = jobs_dir
        os.makedirs(jobs_dir, exist_ok=True)
    
    def create_job(self, prompt, duration=30, style="cinematic", platforms=None):
        """
        Create a new video generation job.
        
        Args:
            prompt (str): User's description of the desired video
            duration (int): Target duration in seconds
            style (str): Style preference
            platforms (list): List of platforms to publish to
            
        Returns:
            str: Job ID
        """
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # Create job directory
        job_dir = os.path.join(self.jobs_dir, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        # Save job metadata
        job_metadata = {
            "job_id": job_id,
            "prompt": prompt,
            "duration": duration,
            "style": style,
            "platforms": platforms or [],
            "created_at": time.time(),
            "status": "initializing"
        }
        
        with open(os.path.join(job_dir, "metadata.json"), 'w') as f:
            json.dump(job_metadata, f, indent=2)
        
        # Initialize status
        update_job_status(job_dir, "initializing")
        
        logger.info(f"Created job {job_id} for prompt: {prompt}")
        
        return job_id
    
    def process_job(self, job_id):
        """
        Process a video generation job.
        
        Args:
            job_id (str): Job ID to process
            
        Returns:
            dict: Job result information
        """
        job_dir = os.path.join(self.jobs_dir, job_id)
        
        if not os.path.exists(job_dir):
            logger.error(f"Job directory not found: {job_dir}")
            return {"error": "Job not found"}
        
        try:
            # Load job metadata
            with open(os.path.join(job_dir, "metadata.json"), 'r') as f:
                metadata = json.load(f)
            
            prompt = metadata["prompt"]
            duration = metadata["duration"]
            style = metadata["style"]
            platforms = metadata["platforms"]
            
            logger.info(f"Processing job {job_id}: {prompt}")
            
            # Step 1: Generate script
            logger.info("Step 1: Generating script")
            script_path = generate_script(prompt, duration, style, job_dir)
            
            # Step 2: Generate assets
            logger.info("Step 2: Generating assets")
            assets_dir = generate_assets(script_path, job_dir)
            
            # Step 3: Create animation
            logger.info("Step 3: Creating animation")
            animation_path = create_animation(script_path, assets_dir, job_dir)
            
            # Step 4: Generate audio and combine with animation
            logger.info("Step 4: Generating audio and combining with animation")
            final_video_path = generate_audio(script_path, animation_path, job_dir)
            
            # Step 5: Publish to platforms (if requested)
            publish_results = {}
            if platforms:
                logger.info(f"Step 5: Publishing to platforms: {platforms}")
                publish_metadata = {
                    "title": f"Video about {prompt}",
                    "description": f"Generated video about {prompt} in {style} style.",
                    "tags": ["generated", "ai", "video", style] + prompt.split()
                }
                publish_results = publish_to_platforms(final_video_path, platforms, publish_metadata)
            
            # Update job metadata
            metadata["completed_at"] = time.time()
            metadata["status"] = "completed"
            metadata["video_path"] = final_video_path
            metadata["publish_results"] = publish_results
            
            with open(os.path.join(job_dir, "metadata.json"), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Job {job_id} completed successfully")
            
            return {
                "job_id": job_id,
                "status": "completed",
                "video_path": final_video_path,
                "publish_results": publish_results
            }
        
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")
            
            # Update job metadata to reflect error
            try:
                with open(os.path.join(job_dir, "metadata.json"), 'r') as f:
                    metadata = json.load(f)
                
                metadata["status"] = "error"
                metadata["error"] = str(e)
                
                with open(os.path.join(job_dir, "metadata.json"), 'w') as f:
                    json.dump(metadata, f, indent=2)
            except:
                pass
            
            update_job_status(job_dir, "error")
            
            return {
                "job_id": job_id,
                "status": "error",
                "error": str(e)
            }
    
    def get_job_status(self, job_id):
        """
        Get the status of a job.
        
        Args:
            job_id (str): Job ID to check
            
        Returns:
            dict: Job status information
        """
        job_dir = os.path.join(self.jobs_dir, job_id)
        
        if not os.path.exists(job_dir):
            return {"error": "Job not found"}
        
        try:
            # Load job metadata
            with open(os.path.join(job_dir, "metadata.json"), 'r') as f:
                metadata = json.load(f)
            
            # Get current status
            status_file = os.path.join(job_dir, "status.txt")
            if os.path.exists(status_file):
                with open(status_file, 'r') as f:
                    current_status = f.read().strip()
            else:
                current_status = metadata.get("status", "unknown")
            
            # Check if video is ready
            video_path = metadata.get("video_path", "")
            video_ready = os.path.exists(video_path) if video_path else False
            
            return {
                "job_id": job_id,
                "status": current_status,
                "created_at": metadata.get("created_at"),
                "completed_at": metadata.get("completed_at"),
                "video_ready": video_ready,
                "video_path": video_path if video_ready else None,
                "publish_results": metadata.get("publish_results", {})
            }
        
        except Exception as e:
            logger.error(f"Error getting job status for {job_id}: {str(e)}")
            return {
                "job_id": job_id,
                "status": "error",
                "error": str(e)
            }
    
    def list_jobs(self):
        """
        List all jobs.
        
        Returns:
            list: List of job information
        """
        jobs = []
        
        try:
            for job_id in os.listdir(self.jobs_dir):
                job_dir = os.path.join(self.jobs_dir, job_id)
                
                if os.path.isdir(job_dir):
                    job_status = self.get_job_status(job_id)
                    if "error" not in job_status:
                        jobs.append(job_status)
        
        except Exception as e:
            logger.error(f"Error listing jobs: {str(e)}")
        
        # Sort by creation time (newest first)
        jobs.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        
        return jobs
