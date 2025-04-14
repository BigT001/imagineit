import os
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
JOBS_DIR = os.path.join(DATA_DIR, 'jobs')
JOBS_FILE = os.path.join(DATA_DIR, 'jobs.json')

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(JOBS_DIR, exist_ok=True)

def _ensure_db_exists():
    """Ensure the database file exists."""
    if not os.path.exists(JOBS_FILE):
        with open(JOBS_FILE, 'w') as f:
            json.dump([], f)

def _read_jobs() -> List[Dict[str, Any]]:
    """Read all jobs from the database."""
    _ensure_db_exists()
    try:
        with open(JOBS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error(f"Error reading jobs file: {JOBS_FILE}")
        return []

def _write_jobs(jobs: List[Dict[str, Any]]):
    """Write jobs to the database."""
    _ensure_db_exists()
    with open(JOBS_FILE, 'w') as f:
        json.dump(jobs, f, indent=2)

def create_job(job_id: str, prompt: str) -> Dict[str, Any]:
    """Create a new job with the given ID and prompt."""
    timestamp = int(time.time())
    
    job = {
        "id": job_id,
        "prompt": prompt,
        "status": "pending",
        "created_at": timestamp,
        "updated_at": timestamp,
        "video_ready": False
    }
    
    jobs = _read_jobs()
    jobs.append(job)
    _write_jobs(jobs)
    
    # Create job directory
    job_dir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    logger.info(f"Created job {job_id} with prompt: {prompt}")
    
    return job

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Get a job by ID."""
    jobs = _read_jobs()
    for job in jobs:
        if job["id"] == job_id:
            return job
    return None

def get_jobs() -> List[Dict[str, Any]]:
    """Get all jobs."""
    return _read_jobs()

def update_job_status(job_id: str, status: str, error: str = None) -> bool:
    """Update the status of a job."""
    jobs = _read_jobs()
    
    for i, job in enumerate(jobs):
        if job["id"] == job_id:
            job["status"] = status
            job["updated_at"] = int(time.time())
            
            if error:
                job["error"] = error
            
            _write_jobs(jobs)
            logger.info(f"Updated job {job_id} status to {status}")
            return True
    
    logger.error(f"Job {job_id} not found for status update")
    return False

def update_job_video(job_id: str, video_path: str) -> bool:
    """Update the video path of a job."""
    jobs = _read_jobs()
    
    for i, job in enumerate(jobs):
        if job["id"] == job_id:
            job["video_path"] = video_path
            job["video_ready"] = True
            job["updated_at"] = int(time.time())
            
            _write_jobs(jobs)
            logger.info(f"Updated job {job_id} with video path: {video_path}")
            return True
    
    logger.error(f"Job {job_id} not found for video path update")
    return False

def delete_job(job_id: str) -> bool:
    """Delete a job by ID."""
    jobs = _read_jobs()
    
    for i, job in enumerate(jobs):
        if job["id"] == job_id:
            del jobs[i]
            _write_jobs(jobs)
            logger.info(f"Deleted job {job_id}")
            return True
    
    logger.error(f"Job {job_id} not found for deletion")
    return False
