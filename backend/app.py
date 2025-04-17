from datetime import datetime
import os
import json
import uuid
from flask_cors import CORS
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
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],  # Your React app's origin
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# Configure upload folder
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
        # Generate a unique filename
        file_id = str(uuid.uuid4())
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{file_id}.{ext}"
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        return jsonify({
            "status": "success",
            "message": "File uploaded successfully",
            "image_id": file_id,
            "filename": filename,
            "url": f"/api/uploads/{filename}"
        })
    
    return jsonify({
        "status": "error",
        "message": "File type not allowed"
    }), 400

@app.route('/api/uploads/<filename>', methods=['GET'])
def get_uploaded_file(filename):
    """Get an uploaded file."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        prompt = data.get('prompt')
        
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400
        
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # Create job in database
        job = create_job(job_id, prompt)
        
        # Start job processing in a separate thread
        threading.Thread(target=process_job, args=(job_id,)).start()
        
        return jsonify({"job_id": job_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/job', methods=['POST'])
def create_new_job():
    """Create a new video generation job."""
    data = request.json
    
    if not data or 'prompt' not in data:
        return jsonify({
            "status": "error",
            "message": "No prompt provided"
        }), 400
    
    prompt = data['prompt']
    image_id = data.get('image_id')
    
    # Generate a unique job ID
    job_id = str(uuid.uuid4())
    
    # Create a new job in the database
    create_job(job_id, prompt, image_id)
    
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

@app.route('/api/job/<job_id>', methods=['GET'])
def get_job_status(job_id):
    try:
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Format the response
        response = {
            "status": "success",
            "job": {
                "job_id": job.get("job_id"),
                "prompt": job.get("prompt", ""),
                "status": job.get("status", "pending"),
                "progress": job.get("progress", 0),
                "current_step": job.get("current_step", ""),
                "steps": job.get("steps", []),
                "created_at": job.get("created_at", 0),
                "updated_at": job.get("updated_at", 0),
                "completed_at": job.get("completed_at"),
                "error": job.get("error"),
                "video_ready": job.get("video_ready", False),
                "video_path": job.get("video_path"),
                "output": {
                    "script": job.get("script"),
                    "assets": job.get("assets", []),
                    "video_url": f"/api/video/{job_id}" if job.get("video_ready") else None
                },
                "createdAt": datetime.fromtimestamp(job.get("created_at", 0)).isoformat() if job.get("created_at") else ""
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        app.logger.error(f"Error getting job status: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

    try:
        print(f"Fetching job with ID: {job_id}")
        job = get_job(job_id)
        if not job:
            print(f"Job not found: {job_id}")
            return jsonify({"error": "Job not found"}), 404
        
        print(f"Job found: {job}")
        return jsonify(job), 200
    except Exception as e:
        print(f"Error fetching job: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/video/<job_id>', methods=['GET'])
def get_video(job_id):
    """Get a video for a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if video is ready
        if job.get("status") != "completed" or not job.get("output", {}).get("video"):
            return jsonify({"status": "error", "message": "Video not ready"}), 400
        
        # Check if the video file exists
        video_path = job["output"]["video"]
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

@app.route('/api/image/<job_id>/<index>', methods=['GET'])
def get_image(job_id, index):
    """Get a generated image for a job."""
    try:
        # Get job details
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Check if images exist
        if not job.get("output", {}).get("images") or int(index) >= len(job["output"]["images"]):
            return jsonify({"status": "error", "message": "Image not found"}), 404
        
        # Get the image path
        image_path = job["output"]["images"][int(index)]
        if not os.path.exists(image_path):
            return jsonify({"status": "error", "message": "Image file not found"}), 404
        
        # Get the directory and filename
        directory = os.path.dirname(image_path)
        filename = os.path.basename(image_path)
        
        # Serve the file
        return send_from_directory(directory, filename)
    except Exception as e:
        app.logger.error(f"Error getting image: {str(e)}")
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
        if not job.get("output", {}).get("script"):
            return jsonify({"status": "error", "message": "Script not found"}), 404
        
        script_path = job["output"]["script"]
        if not os.path.exists(script_path):
            return jsonify({"status": "error", "message": "Script file not found"}), 404
        
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

@app.route('/api/jobs/<job_id>/cancel', methods=['POST'])
def cancel_job(job_id):
    try:
        job = get_job(job_id)
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Update job status to cancelled
        from modules.database import update_job_status
        updated_job = update_job_status(
            job_id, 
            status="cancelled",
            current_step="Job cancelled by user"
        )
        
        return jsonify(updated_job), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
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


    try:
        job = get_job(job_id)
        if not job:
            return jsonify({"status": "error", "message": "Job not found"}), 404
        
        # Format the response to match the JobStatusInfo interface
        response = {
            "status": "success",
            "job": {
                "job_id": job.get("job_id"),
                "prompt": job.get("prompt", ""),
                "status": job.get("status", "pending"),
                "progress": job.get("progress", 0),
                "current_step": job.get("current_step", ""),
                "steps": job.get("steps", []),
                "created_at": job.get("created_at", 0),
                "updated_at": job.get("updated_at", 0),
                "completed_at": job.get("completed_at"),
                "error": job.get("error"),
                "video_ready": job.get("video_ready", False),
                "video_path": job.get("video_path"),
                "output": {
                    "script": job.get("script"),
                    "assets": job.get("assets", []),
                    "video_url": f"/api/video/{job_id}" if job.get("video_ready") else None
                },
                "createdAt": datetime.fromtimestamp(job.get("created_at", 0)).isoformat() if job.get("created_at") else ""
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        app.logger.error(f"Error getting job status: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

    try:
        job = get_job(job_id)
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        return jsonify(job), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        image = request.files['image']
        if image.filename == '':
            return jsonify({"error": "No image selected"}), 400
        
        # Generate a unique ID for the image
        image_id = str(uuid.uuid4())
        
        # Create uploads directory if it doesn't exist
        uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Save the image
        image_path = os.path.join(uploads_dir, f"{image_id}.jpg")
        image.save(image_path)
        
        return jsonify({
            "image_id": image_id,
            "image_path": image_path
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=True)
