import random
import os
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from moviepy import VideoFileClip

#initializing Izri AI

app = FastAPI(
    title="Izri AI API",
    description="Backend for TRIBE V2 neural response prediction",
    version="1.0.0",
)
###CORS SETUP###
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# temporary upload directory exists
os.makedirs("temp_uploads", exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Welcome to the Izri AI API!"}
@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": False}

###DUMMY ENDPOINTS FOR TESTING PURPOSES###
@app.get("/api/predict-dummy")
async def get_dummy_brain_data():
    # Randomly select a simulated patient state
    scenario = random.choice(["resting", "cognitive_load", "deep_focus"])
    
    # Generate data based on the scenario
    if scenario == "resting":
        # Low brain activity (mostly blue UI)
        activation_data = [round(random.uniform(0.0, 0.3), 3) for _ in range(100)]
    elif scenario == "cognitive_load":
        # High brain activity/stress (mostly red UI)
        activation_data = [round(random.uniform(0.7, 1.0), 3) for _ in range(100)]
    else: # deep_focus
        # Mid-level activity (mostly purple UI)
        activation_data = [round(random.uniform(0.4, 0.6), 3) for _ in range(100)]
        
    return {
        "status": "success", 
        "model": "dummy-v1", 
        "scenario": scenario, 
        "data": activation_data
    }

#UPDATED VIDEO UPLOAD ENDPOINT
@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...)):
    # Define the file paths
    video_path = f"temp_uploads/{file.filename}"
    audio_path = f"temp_uploads/{file.filename.split('.')[0]}.mp3"

    # Save the uploaded MP4 directly to the server's hard drive
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract the Audio for the AI model
    try:
        # Load the video into memory
        video = VideoFileClip(video_path)
        # Rip the audio and save it as an MP3
        video.audio.write_audiofile(audio_path, logger=None)
        # Close the file to free up computer memory
        video.close()
        audio_status = "Audio extracted successfully"
    except Exception as e:
        print(f"Error extracting audio: {e}")
        audio_status = "Audio extraction failed"

    return {
        "status": "success",
        "message": f"Successfully received {file.filename}. {audio_status}.",
    }