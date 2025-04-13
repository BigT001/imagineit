from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
import subprocess
from modules.script_generator import generate_script
from modules.asset_generator import generate_assets
from modules.blender_animator import create_animation
from modules.audio_generator import generate_audio
from modules.publisher import publish_to_platforms

app = Flask(__name__)
CORS(app)

# Define paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(BASE_DIR, "config")
WORKSPACE_DIR = os.path.join(BASE_DIR, "workspace")
UPLOADS_DIR = os.path.join(WORKSPACE_DIR, "uploads")
JOBS_DIR = os.path.join(WORKSPACE_DIR, "jobs")

# Ensure directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(JOBS_DIR, exist_ok=True)

# Load Blender configuration
try:
    with open(os.path.join(CONFIG_DIR, "blender_config.json"), 'r') as f:
        config = json.load(f)
    BLENDER_PATH = config.get("blender_path")
except Exception as e:
    print(f"Warning: Could not load Blender config: {e}")
    BLENDER_PATH = None

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"status": "success", "message": "API is working!"})

@app.route('/api/blender-version', methods=['GET'])
def blender_version():
    if not BLENDER_PATH or not os.path.exists(BLENDER_PATH):
        return jsonify({
            "status": "error", 
            "message": f"Blender not found at path: {BLENDER_PATH}"
        }), 400
    
    try:
        result = subprocess.run(
            [BLENDER_PATH, "--version"], 
            capture_output=True, 
            text=True
        )
        return jsonify({
            "status": "success",
            "version": result.stdout.strip()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_video():
    data = request.json
    prompt = data.get('prompt', '')
    duration = data.get('duration', 30)
    style = data.get('style', 'modern')
    platforms = data.get('platforms', [])
    
    # Create a unique job ID
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    try:
        # Generate script
        script_path = generate_script(prompt, duration, style, job_dir)
        
        # Generate assets
        assets_dir = generate_assets(script_path, job_dir)
        # Create animation
        animation_path = create_animation(script_path, assets_dir, job_dir)
        
        # Generate audio and final video
        final_video_path = generate_audio(script_path, animation_path, job_dir)
        
        # Publish to platforms if requested
        publish_results = {}
        if platforms:
            publish_results = publish_to_platforms(
                final_video_path, 
                platforms, 
                {"title": f"Video about {prompt}", "description": prompt}
            )
        
        # Return the results
        return jsonify({
            "status": "success",
            "message": "Video generation completed",
            "job_id": job_id,
            "video_path": final_video_path,
            "publish_results": publish_results
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
    
    # Generate a unique filename
    filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOADS_DIR, filename)
    
    # Save the file
    file.save(file_path)
    
    return jsonify({
        "status": "success",
        "message": "File uploaded successfully",
        "file_id": os.path.splitext(filename)[0],
        "file_path": file_path
    })

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    job_dir = os.path.join(JOBS_DIR, job_id)
    
    if not os.path.exists(job_dir):
        return jsonify({
            "status": "error",
            "message": f"Job with ID {job_id} not found"
        }), 404
    
    # Check the status file
    status_file = os.path.join(job_dir, "status.txt")
    if os.path.exists(status_file):
        with open(status_file, 'r') as f:
            status = f.read().strip()
    else:
        status = "initializing"
    
    # Check if final video exists
    final_video_path = os.path.join(job_dir, "final_video.mp4")
    video_ready = os.path.exists(final_video_path)
    
    return jsonify({
        "status": status,
        "job_id": job_id,
        "video_ready": video_ready,
        "video_path": final_video_path if video_ready else None
    })

@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    jobs = []
    
    for job_id in os.listdir(JOBS_DIR):
        job_dir = os.path.join(JOBS_DIR, job_id)
        if os.path.isdir(job_dir):
            # Get status
            status_file = os.path.join(job_dir, "status.txt")
            if os.path.exists(status_file):
                with open(status_file, 'r') as f:
                    status = f.read().strip()
            else:
                status = "unknown"
            
            # Get request details if available
            request_file = os.path.join(job_dir, "request.json")
            request_data = {}
            if os.path.exists(request_file):
                with open(request_file, 'r') as f:
                    request_data = json.load(f)
            
            # Check if final video exists
            final_video_path = os.path.join(job_dir, "final_video.mp4")
            video_ready = os.path.exists(final_video_path)
            
            jobs.append({
                "job_id": job_id,
                "status": status,
                "prompt": request_data.get("prompt", ""),
                "created_at": os.path.getctime(job_dir),
                "video_ready": video_ready
            })
    
    # Sort by creation time (newest first)
    jobs.sort(key=lambda x: x["created_at"], reverse=True)
    
    return jsonify({
        "status": "success",
        "jobs": jobs
    })

if __name__ == '__main__':
    print(f"Starting Flask server on http://localhost:5000")
    print(f"Blender path: {BLENDER_PATH}")
    app.run(debug=True, port=5000)
