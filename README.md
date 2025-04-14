# ImagineIt - AI Video Generation System

ImagineIt is an AI-powered video generation system that creates videos from text prompts. It uses Hugging Face for script generation, Stability AI for image generation, and Blender for animation.

## System Architecture

The system consists of the following components:

1. **API Server**: A Flask-based API server that handles job creation and status updates.
2. **Script Generator**: Uses Hugging Face's API to generate video scripts from text prompts.
3. **Asset Generator**: Uses Stability AI to generate images for each scene in the script.
4. **Blender Animator**: Uses Blender to create animations from the script and assets.
5. **Job Processor**: Coordinates the entire process and updates job status.

## Setup

### Prerequisites

- Python 3.8+
- Blender 3.0+
- Hugging Face API key
- Stability AI API key

### Environment Variables

Create a `.env` file with the following variables:

```
HUGGINGFACE_API_KEY=your_huggingface_api_key
STABILITY_API_KEY=your_stability_api_key
BLENDER_PATH=/path/to/blender
PORT=5000
```

### Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `python app.py`

## API Endpoints

- `GET /api/test`: Test endpoint to verify the API is working
- `GET /api/blender-version`: Get the version of Blender installed
- `POST /api/upload`: Upload a file to the server
- `POST /api/generate`: Generate a video based on a prompt
- `GET /api/jobs`: Get all jobs
- `GET /api/jobs/<job_id>`: Get the status of a job
- `GET /api/videos/<job_id>`: Get the video for a job
- `GET /api/script/<job_id>`: Get the script for a job
- `GET /api/assets/<job_id>`: Get the assets for a job
- `GET /api/asset/<job_id>/<asset_type>/<filename>`: Get a specific asset file for a job
- `POST /api/cancel/<job_id>`: Cancel a job

## Usage

1. Send a POST request to `/api/generate` with a JSON body containing a `prompt` field.
2. The server will return a job ID.
3. Poll the `/api/jobs/<job_id>` endpoint to check the status of the job.
4. Once the job is completed, get the video from `/api/videos/<job_id>`.

## License

MIT
```

Finally, let's create a requirements.txt file:

```text:requirements.txt
flask==2.2.3
flask-cors==3.0.10
python-dotenv==1.0.0
requests==2.28.2
pillow==9.4.0
werkzeug==2.2.3
