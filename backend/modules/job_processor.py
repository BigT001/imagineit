import os
import json
import logging
import time
import traceback
from pathlib import Path

from modules.database import get_job, update_job_status, update_job_video
from modules.script_generator import ScriptGenerator
from modules.asset_generator import AssetGenerator
from modules.blender_animator import BlenderAnimator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Jobs directory
JOBS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'jobs')

def process_job(job_id):
    """Process a job with the given ID."""
    try:
        logger.info(f"Starting to process job {job_id}")
        
        # Update job status to initializing
        update_job_status(job_id, "initializing")
        
        # Get job details
        job = get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        logger.info(f"Processing job with prompt: {job['prompt']}")
        
        # Create job directory if it doesn't exist
        job_dir = os.path.join(JOBS_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        # Generate script
        logger.info(f"Generating script for job {job_id}")
        update_job_status(job_id, "generating_script")
        script_generator = ScriptGenerator()
        script_result = script_generator.generate_script(job["prompt"])
        
        if script_result["status"] != "success":
            error_msg = script_result.get('error', 'Unknown error during script generation')
            logger.error(f"Script generation failed: {error_msg}")
            update_job_status(job_id, "error", error=error_msg)
            return
        
        # Save script to job directory
        script_path = os.path.join(job_dir, "script.json")
        with open(script_path, 'w') as f:
            json.dump(script_result["script"], f, indent=2)
        
        logger.info(f"Script generated and saved to {script_path}")
        
        # Generate assets
        logger.info(f"Generating assets for job {job_id}")
        update_job_status(job_id, "generating_assets")
        asset_generator = AssetGenerator()
        assets_result = asset_generator.generate_assets(job_dir, script_result["script"])
        
        if assets_result["status"] != "success":
            error_msg = assets_result.get('error', 'Unknown error during asset generation')
            logger.error(f"Asset generation failed: {error_msg}")
            update_job_status(job_id, "error", error=error_msg)
            return
        
        logger.info(f"Assets generated for job {job_id}")
        
        # Create animation
        logger.info(f"Creating animation for job {job_id}")
        update_job_status(job_id, "creating_animation")
        blender_animator = BlenderAnimator()
        animation_result = blender_animator.create_animation(
            job_dir, 
            script_result["script"],
            assets_result["assets"]
        )
        
        if animation_result["status"] != "success":
            error_msg = animation_result.get('error', 'Unknown error during animation creation')
            logger.error(f"Animation creation failed: {error_msg}")
            update_job_status(job_id, "error", error=error_msg)
            return
        
        logger.info(f"Animation created for job {job_id}")
        
        # Update job with video path
        video_path = animation_result["output_path"]
        logger.info(f"Video generated at {video_path}")
        update_job_video(job_id, video_path)
        
        # Mark job as completed
        update_job_status(job_id, "completed")
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        error_msg = f"Error processing job {job_id}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        update_job_status(job_id, "error", error=str(e))
