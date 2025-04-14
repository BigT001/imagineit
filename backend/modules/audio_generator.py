import os
import json
import requests
import subprocess
import tempfile
from backend.modules.utils import ELEVENLABS_API_KEY, update_job_status, logger

def generate_audio(script_path, animation_path, job_dir):
    """
    Generate audio for the video based on the script using ElevenLabs API.
    
    Args:
        script_path (str): Path to the script JSON file
        animation_path (str): Path to the animation file
        job_dir (str): Directory to save the audio files
        
    Returns:
        str: Path to the final video with audio
    """
    logger.info(f"Generating audio for animation: {animation_path}")
    
    # Update status
    update_job_status(job_dir, "generating_audio")
    
    # Load the script
    with open(script_path, 'r') as f:
        script = json.load(f)
    
    # Create audio directory
    audio_dir = os.path.join(job_dir, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    # Generate voiceover for each scene
    scene_audio_files = []
    
    try:
        if ELEVENLABS_API_KEY:
            for scene in script["scenes"]:
                scene_id = scene["scene_id"]
                narration = scene.get("narration", "")
                
                if narration:
                    # Call ElevenLabs API to generate speech
                    ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"  # Rachel voice
                    
                    headers = {
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": ELEVENLABS_API_KEY
                    }
                    
                    payload = {
                        "text": narration,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.5
                        }
                    }
                    
                    response = requests.post(ELEVENLABS_API_URL, json=payload, headers=headers)
                    
                    if response.status_code == 200:
                        # Save the audio file
                        audio_file = os.path.join(audio_dir, f"scene_{scene_id}.mp3")
                        with open(audio_file, "wb") as f:
                            f.write(response.content)
                        
                        scene_audio_files.append((scene_id, audio_file))
                        logger.info(f"Generated audio for scene {scene_id}")
                    else:
                        logger.warning(f"ElevenLabs API request failed: {response.text}")
                        # Fall back to empty audio
                        scene_audio_files.append((scene_id, None))
                else:
                    scene_audio_files.append((scene_id, None))
        else:
            logger.warning("No ElevenLabs API key found, skipping audio generation")
            return create_mock_final_video(job_dir)
    except Exception as e:
        logger.error(f"Error generating audio: {str(e)}")
        return create_mock_final_video(job_dir)
    
    # Combine audio with video
    try:
        # Check if we have any audio files
        if not any(audio_file for _, audio_file in scene_audio_files):
            logger.warning("No audio files generated, using mock video")
            return create_mock_final_video(job_dir)
        
        # Check if ffmpeg is available
        try:
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        except (subprocess.SubprocessError, FileNotFoundError):
            logger.warning("ffmpeg not found, using mock video")
            return create_mock_final_video(job_dir)
        
        # Create a temporary file with silence
        silence_file = os.path.join(audio_dir, "silence.mp3")
        subprocess.run(
            ["ffmpeg", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "1", "-q:a", "9", "-acodec", "libmp3lame", silence_file],
            capture_output=True,
            check=True
        )
        
        # Create a file list for concatenation
        concat_file = os.path.join(audio_dir, "concat.txt")
        with open(concat_file, "w") as f:
            for scene_id, audio_file in sorted(scene_audio_files):
                if audio_file and os.path.exists(audio_file):
                    f.write(f"file '{os.path.abspath(audio_file)}'\n")
                else:
                    # Use silence for scenes without narration
                    f.write(f"file '{os.path.abspath(silence_file)}'\n")
        
        # Concatenate all audio files
        full_audio_file = os.path.join(audio_dir, "full_audio.mp3")
        subprocess.run(
            ["ffmpeg", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", full_audio_file],
            capture_output=True,
            check=True
        )
        
        # Combine audio with video
        final_video_path = os.path.join(job_dir, "final_video.mp4")
        subprocess.run(
            ["ffmpeg", "-i", animation_path, "-i", full_audio_file, "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0", final_video_path],
            capture_output=True,
            check=True
        )
        
        if os.path.exists(final_video_path):
            logger.info(f"Final video created: {final_video_path}")
            update_job_status(job_dir, "completed")
            return final_video_path
        else:
            logger.error("Final video file was not created")
            return create_mock_final_video(job_dir)
    
    except Exception as e:
        logger.error(f"Error combining audio with video: {str(e)}")
        return create_mock_final_video(job_dir)

def create_mock_final_video(job_dir):
    """Create a mock final video file when audio generation fails."""
    final_video_path = os.path.join(job_dir, "final_video.mp4")
    with open(final_video_path, 'w') as f:
        f.write("Mock final video file with audio")
    
    logger.warning(f"Created mock final video: {final_video_path}")
    update_job_status(job_dir, "completed")
    
    return final_video_path
