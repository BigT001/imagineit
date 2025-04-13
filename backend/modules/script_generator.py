import os
import json

def generate_script(prompt, duration, style, job_dir):
    """
    Generate a video script based on the user prompt.
    
    Args:
        prompt (str): User's description of the desired video
        duration (int): Target duration in seconds
        style (str): Style preference
        job_dir (str): Directory to save the generated script
        
    Returns:
        str: Path to the generated script file
    """
    print(f"Generating script for prompt: {prompt}")
    
    # In a real implementation, you would call an LLM API here
    # For now, we'll create a simple mock script
    
    script = {
        "title": f"Video about {prompt}",
        "duration": duration,
        "style": style,
        "scenes": [
            {
                "scene_id": 1,
                "duration": duration * 0.3,
                "description": f"Opening scene introducing {prompt}",
                "narration": f"Let's explore {prompt} together.",
                "visuals": ["wide shot", "fade in"],
                "animation_notes": "Smooth camera pan from left to right"
            },
            {
                "scene_id": 2,
                "duration": duration * 0.4,
                "description": f"Main content about {prompt}",
                "narration": f"Here are the key aspects of {prompt} that make it interesting.",
                "visuals": ["close up", "detailed view"],
                "animation_notes": "Highlight key elements with subtle glow effect"
            },
            {
                "scene_id": 3,
                "duration": duration * 0.3,
                "description": "Conclusion and call to action",
                "narration": "Thanks for watching! Don't forget to like and subscribe.",
                "visuals": ["zoom out", "fade to logo"],
                "animation_notes": "Fade to brand colors and display social media handles"
            }
        ]
    }
    
    # Save the script to a file
    script_path = os.path.join(job_dir, "script.json")
    with open(script_path, 'w') as f:
        json.dump(script, f, indent=2)
    
    # Create a status file to track progress
    with open(os.path.join(job_dir, "status.txt"), 'w') as f:
        f.write("script_generated")
    
    return script_path
