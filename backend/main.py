from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

#initializing Mindora

app = FastAPI(
    title="Mindora API",
    description="Backend for TRIBE V2 neural response prediction",
    version="1.0.0",
)
###CORS SETUP###
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Mindora API!"}
@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": False}

###DUMMY ENDPOINTS FOR TESTING PURPOSES###
@app.get("/api/predict-dummy")
async def get_dummy_brain_data():
    # 1. Randomly select a simulated patient state
    scenario = random.choice(["resting", "cognitive_load", "deep_focus"])
    
    # 2. Generate data based on the scenario
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