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
    # Simulate TRIBE V2 fMRI output: an array of 100 activation values between 0.0 and 1.0 (List Comprehension)
    activation_data = [round(random.uniform(0.0, 1.0), 3) for _ in range(100)]
    return {"status": "success","model":"dummy-v1", "data": activation_data}
