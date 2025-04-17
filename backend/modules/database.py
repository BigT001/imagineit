import os
import json
import time
import logging
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
JOBS_DIR = os.path.join(DATA_DIR, 'jobs')
JOBS_FILE = os.path.join(DATA_DIR, 'jobs.json')

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(JOBS_DIR, exist_ok=True)

# Initialize jobs file if it doesn't exist
if not os.path.exists(JOBS_FILE):
    with open(JOBS_FILE, 'w') as f:
        json.dump([], f)

def get_jobs() -> List[Dict[str, Any]]:
    """Get all jobs."""
    try:
        with open(JOBS_FILE, 'r') as f:
            jobs = json.load(f)
        return jobs
    except Exception as e:
        logger.error(f"Error getting jobs: {e}")
        return []

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Get a job by ID."""
    try:
        job_file = os.path.join(JOBS_DIR, f"{job_id}.json")
        if not os.path.exists(job_file):
            logger.warning(f"Job file not found: {job_file}")
            return None
        
        with open(job_file, 'r') as f:
            job = json.load(f)
        return job
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {e}")
        return None
    """Get a job by ID."""
    try:
        job_file = os.path.join(JOBS_DIR, f"{job_id}.json")
        if not os.path.exists(job_file):
            return None
        
        with open(job_file, 'r') as f:
            job = json.load(f)
        return job
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {e}")
        return None

def create_job(job_id: str, prompt: str, image_id: Optional[str] = None) -> Dict[str, Any]:
    """Create a new job."""
    try:
        # Create job data
        job = {
            "job_id": job_id,
            "prompt": prompt,
            "image_id": image_id,
            "created_at": time.time(),
            "updated_at": time.time(),
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
                    "message": "Waiting for asset generation"
                },
                {
                    "name": "rendering",
                    "status": "pending",
                    "progress": 0,
                    "message": "Waiting for animation"
                }
            ],
            "output": {}
        }
        
        # Save job to file
        job_file = os.path.join(JOBS_DIR, f"{job_id}.json")
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
        
        # Add job to jobs list
        jobs = get_jobs()
        jobs.append({
            "job_id": job_id,
            "prompt": prompt,
            "created_at": job["created_at"],
            "status": job["status"],
            "progress": job["progress"]
        })
        
        # Save jobs list
        with open(JOBS_FILE, 'w') as f:
            json.dump(jobs, f, indent=2)
        
        logger.info(f"Created job {job_id} with prompt: {prompt}")
        return job
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise

def update_job_status(job_id: str, status: Optional[str] = None, **kwargs) -> Dict[str, Any]:
    """Update job status."""
    try:
        # Get job
        job_file = os.path.join(JOBS_DIR, f"{job_id}.json")
        if not os.path.exists(job_file):
            raise ValueError(f"Job {job_id} not found")
        
        with open(job_file, 'r') as f:
            job = json.load(f)
        
        # Update job status
        if status:
            job["status"] = status
        
        # Update job fields
        for key in ["progress", "current_step", "error"]:
            if key in kwargs:
                job[key] = kwargs[key]
        
        # Update specific step
        if "step_name" in kwargs:
            step_name = kwargs["step_name"]
            step_found = False
            
            for step in job["steps"]:
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
        
        # Update job timestamp
        job["updated_at"] = time.time()
        
        # Save job
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
        
        # Update job in jobs list
        jobs = get_jobs()
        for j in jobs:
            if j["job_id"] == job_id:
                j["status"] = job["status"]
                j["progress"] = job.get("progress", 0)
                break
        
        # Save jobs list
        with open(JOBS_FILE, 'w') as f:
            json.dump(jobs, f, indent=2)
        
        logger.info(f"Updated job {job_id} status to {status}")
        return job
    except Exception as e:
        logger.error(f"Error updating job status: {e}")
        raise

def update_job_output(job_id: str, output: Dict[str, Any]) -> Dict[str, Any]:
    """Update job output."""
    try:
        # Get job
        job_file = os.path.join(JOBS_DIR, f"{job_id}.json")
        if not os.path.exists(job_file):
            raise ValueError(f"Job {job_id} not found")
        
        with open(job_file, 'r') as f:
            job = json.load(f)
        
        # Update job output
        if "output" not in job:
            job["output"] = {}
        
        for key, value in output.items():
            job["output"][key] = value
        
        # Update job timestamp
        job["updated_at"] = time.time()
        
        # If video is added, mark as ready
        if "video" in output:
            job["video_ready"] = True
            job["video_path"] = output["video"]
        
        # Save job
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
        
        logger.info(f"Updated job {job_id} output")
        return job
    except Exception as e:
        logger.error(f"Error updating job output: {e}")
        raise
