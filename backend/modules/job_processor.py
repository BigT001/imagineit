import os
import json
import logging
import time
import traceback
from pathlib import Path

from modules.database import get_job, update_job_status, update_job_output
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
        update_job_status(job_id, "initializing", 
                          current_step="Initializing job", 
                          progress=5)
        
        # Get job details
        job = get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        logger.info(f"Processing job with prompt: {job['prompt']}")
        
        # Create job directory if it doesn't exist
        job_dir = os.path.join(JOBS_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        # Define a callback function to update job status
        def status_callback(**kwargs):
            update_job_status(job_id, **kwargs)
        
        # Generate script
        logger.info(f"Generating script for job {job_id}")
        update_job_status(job_id, "processing", 
                          current_step="Generating script", 
                          progress=10,
                          step_name="script_generation",
                          step_status="processing",
                          step_progress=0)
        
        script_generator = ScriptGenerator()
        script_result = script_generator.generate_script(job["prompt"], status_callback)
        
        if script_result["status"] != "success":
            error_msg = script_result.get('error', 'Unknown error during script generation')
            logger.error(f"Script generation failed: {error_msg}")
            update_job_status(job_id, "error", 
                              error=error_msg,
                              step_name="script_generation",
                              step_status="error",
                              step_progress=0)
            return
        
        # Save script to job directory
        script_path = os.path.join(job_dir, "script.json")
        with open(script_path, 'w') as f:
            json.dump(script_result["script"], f, indent=2)
        
        # Update job with script output
        update_job_output(job_id, {"script": script_path})
        
        logger.info(f"Script generated and saved to {script_path}")
        
        # Generate assets
        logger.info(f"Generating assets for job {job_id}")
        update_job_status(job_id, "processing", 
                          current_step="Generating assets", 
                          progress=30,
                          step_name="asset_generation",
                          step_status="processing",
                          step_progress=0)
        
        # Call the AssetGenerator to generate assets
        asset_generator = AssetGenerator()
        assets_result = asset_generator.generate_assets(job_dir, script_result["script"], status_callback)
        
        if assets_result["status"] != "success":
            error_msg = assets_result.get('error', 'Unknown error during asset generation')
            logger.error(f"Asset generation failed: {error_msg}")
            update_job_status(job_id, "error", 
                              error=error_msg,
                              step_name="asset_generation",
                              step_status="error",
                              step_progress=0)
            return
        
        # Update job with asset output
        if "assets_path" in assets_result:
            update_job_output(job_id, {"assets": assets_result["assets_path"]})
        
        # Update job status
        update_job_status(job_id, "processing", 
                          current_step="Assets generated", 
                          progress=60,
                          step_name="asset_generation",
                          step_status="completed",
                          step_progress=100)
        
        logger.info(f"Assets generated for job {job_id}")
        
        # Create animation
        logger.info(f"Creating animation for job {job_id}")
        update_job_status(job_id, "processing", 
                          current_step="Creating animation", 
                          progress=70,
                          step_name="animation",
                          step_status="processing",
                          step_progress=0)
        
        # Call the BlenderAnimator to create the animation
        blender_animator = BlenderAnimator()
        animation_result = blender_animator.create_animation(
            job_dir,
            script_result["script"],
            assets_result["assets"],
            status_callback
        )
        
        if animation_result["status"] != "success":
            error_msg = animation_result.get('error', 'Unknown error during animation creation')
            logger.error(f"Animation creation failed: {error_msg}")
            update_job_status(job_id, "error", 
                              error=error_msg,
                              step_name="animation",
                              step_status="error",
                              step_progress=0)
            return
        
        # Update job status
        update_job_status(job_id, "processing", 
                          current_step="Animation created, rendering video", 
                          progress=90,
                          step_name="rendering",
                          step_status="processing",
                          step_progress=0)
        
        logger.info(f"Animation created for job {job_id}")
        
        # Update job with video path
        video_path = animation_result["output_path"]
        logger.info(f"Video generated at {video_path}")
        update_job_output(job_id, {"video": video_path})
        
        # Mark job as completed
        update_job_status(job_id, "completed", 
                          current_step="Video generation completed", 
                          progress=100,
                          step_name="rendering",
                          step_status="completed",
                          step_progress=100)
        
        logger.info(f"Job {job_id} completed successfully")
    
    except Exception as e:
        error_msg = f"Error processing job {job_id}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        update_job_status(job_id, "error", 
                          error=str(e),
                          current_step="Error during processing")
