import os
import json
import uuid
import logging
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import modules - remove unused imports
from modules.database import get_job, update_job_status, get_jobs, create_job
from modules.job_processor import process_job
from modules.blender_animator import BlenderAnimator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Configure data folder
DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'data')
JOBS_FOLDER = os.path.join(DATA_FOLDER, 'jobs')
os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(JOBS_FOLDER, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify the API is working."""
    return jsonify({
        "status": "success",
        "message": "API is working correctly"
    })

@app.route('/api/blender-version', methods=['GET'])
def blender_version():
    """Get the version of Blender installed."""
    try:
        blender = BlenderAnimator()
        version_info = blender.get_blender_version()
        return jsonify(version_info)
    except Exception as e:
        logger.error(f"Error getting Blender version: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error getting Blender version: {str(e)}"
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a file to the server."""
    if 'file' not in request.files:
        return jsonify({
            "status": "error",
            "message": "No file part in the request"
        }), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({
            "status": "error",
            "message": "No file selected"
        }), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        return jsonify({
            "status": "success",
            "message": "File uploaded successfully",
            "filename": filename,
            "path": file_path
        })
    
    return jsonify({
        "status": "error",
        "message": "File type not allowed"
    }), 400

@app.route('/api/generate', methods=['POST'])
def generate_video():
    """Generate a video based on a prompt."""
    data = request.json
    
    if not data or 'prompt' not in data:
        return jsonify({
            "status": "error",
            "message": "No prompt provided"
        }), 400
    
    prompt = data['prompt']
    
    # Generate a unique job ID
    job_id = str(uuid.uuid4())
    
    # Create a new job in the database
    create_job(job_id, prompt)
    
    # Start the job processing in a separate thread
    thread = threading.Thread(target=process_job, args=(job_id,))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "status": "success",
        "message": "Video generation started",
        "job_id": job_id
    })

@app.route('/api/jobs', methods=['GET'])
def get_all_jobs():
    """Get all jobs."""
    jobs = get_jobs()
    return jsonify({
        "status": "success",
        "jobs": jobs
    })

@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get the status of a job."""
    job = get_job(job_id)
    
    if not job:
        return jsonify({
            "status": "error",
            "message": "Job not found"
        }), 404
    
    return jsonify({
        "status": "success",
        "job": job
    })

@app.route('/api/videos/<job_id>', methods=['GET'])
def get_video(job_id):
    """Get a video for a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if video is ready
        if not job.get("video_ready") or not job.get("video_path"):
            return jsonify({"status": "error", "message": "Video not ready"}), 400
        
        # Check if the video file exists
        video_path = job["video_path"]
        if not os.path.exists(video_path):
            return jsonify({"status": "error", "message": "Video file not found"}), 404
        
        # Get the directory and filename
        directory = os.path.dirname(video_path)
        filename = os.path.basename(video_path)
        
        # Serve the file
        return send_from_directory(directory, filename)
    except Exception as e:
        app.logger.error(f"Error getting video: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/script/<job_id>', methods=['GET'])
def get_script(job_id):
    """Get the script for a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if script exists
        script_path = os.path.join(JOBS_FOLDER, job_id, "script.json")
        if not os.path.exists(script_path):
            return jsonify({"status": "error", "message": "Script not found"}), 404
        
        # Read the script
        with open(script_path, 'r') as f:
            script = json.load(f)
        
        return jsonify({
            "status": "success",
            "script": script
        })
    except Exception as e:
        app.logger.error(f"Error getting script: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/assets/<job_id>', methods=['GET'])
def get_assets(job_id):
    """Get the assets for a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if assets exist
        assets_path = os.path.join(JOBS_FOLDER, job_id, "assets.json")
        if not os.path.exists(assets_path):
            return jsonify({"status": "error", "message": "Assets not found"}), 404
        
        # Read the assets
        with open(assets_path, 'r') as f:
            assets = json.load(f)
        
        return jsonify({
            "status": "success",
            "assets": assets
        })
    except Exception as e:
        app.logger.error(f"Error getting assets: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/asset/<job_id>/<asset_type>/<filename>', methods=['GET'])
def get_asset_file(job_id, asset_type, filename):
    """Get a specific asset file for a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if asset exists
        asset_dir = os.path.join(JOBS_FOLDER, job_id, "assets", asset_type)
        asset_path = os.path.join(asset_dir, filename)
        
        if not os.path.exists(asset_path):
            return jsonify({"status": "error", "message": "Asset not found"}), 404
        
        # Serve the file
        return send_from_directory(asset_dir, filename)
    except Exception as e:
        app.logger.error(f"Error getting asset: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/cancel/<job_id>', methods=['POST'])
def cancel_job(job_id):
    """Cancel a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if job can be canceled
        if job["status"] in ["completed", "error", "canceled"]:
            return jsonify({"status": "error", "message": f"Job cannot be canceled (status: {job['status']})"}), 400
        
        # Update job status
        update_job_status(job_id, "canceled")
        
        return jsonify({
            "status": "success",
            "message": "Job canceled successfully"
        })
    except Exception as e:
        app.logger.error(f"Error canceling job: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """Serve the index page."""
    return jsonify({
        "status": "success",
        "message": "ImagineIt API Server",
        "version": "1.0.0"
    })

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=True)
