import os
import time
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

# Load environment variables from .env file
load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GEMINI_API_KEY not found! Please check your backend/.env file.")

app = FastAPI(title="QueryMind AI Resume Parser API")

# Enable CORS so your React frontend can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any frontend origin during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Output Schemas for Strict JSON Validation
class ExperienceItem(BaseModel):
    company: str = Field(description="Name of the employer or company")
    role: str = Field(description="Job title held by the candidate")
    duration: str = Field(description="Time period worked, e.g., '2022 - 2024'")
    key_responsibilities: List[str] = Field(description="Bullet points of key duties or achievements")

class ResumeModel(BaseModel):
    full_name: str = Field(description="Candidate's full name")
    email: str = Field(description="Candidate's email address")
    phone: Optional[str] = Field(description="Candidate's phone number if available")
    skills: List[str] = Field(description="Extracted technical and soft skills")
    experience: List[ExperienceItem] = Field(description="Chronological work history")
    education: List[str] = Field(description="Degrees, universities, and graduation years")
    overall_fit_score: int = Field(description="Estimated score from 1-100 based on general professional quality")

@app.post("/api/parse-resume", response_model=ResumeModel)
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Receives an uploaded document file from React, uploads it to Gemini 3.8 Flash,
    enforces Pydantic schema validation, and returns clean structured JSON.
    """
    temp_file_path = f"temp_{file.filename}"
    
    try:
        # Save uploaded file temporarily to local disk
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)

        client = genai.Client()
        
        # Upload file to Gemini Files API
        print(f"Uploading {file.filename} to Gemini Files API...")
        uploaded_file = client.files.upload(file=temp_file_path)

        prompt = """
        You are an expert HR recruiter and technical talent evaluator. Analyze the attached document 
        and extract structured profile data matching the requested schema. Ensure all fields are accurately populated.
        """

        # Retry loop for 503 server traffic capacity spikes
        max_retries = 3
        delay = 3
        response = None

        for attempt in range(1, max_retries + 1):
            try:
                print(f"Calling Gemini 3.8 Flash (Attempt {attempt}/{max_retries})...")
                response = client.models.generate_content(
                    model='gemini-3.8-flash',
                    contents=[uploaded_file, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ResumeModel,
                        temperature=0.1,
                    ),
                )
                break
            except Exception as e:
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    if attempt == max_retries:
                        raise e
                    print(f"[Warning] Server busy (503). Retrying in {delay} seconds...")
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise e

        # Clean up remote file from Gemini server and local temporary file
        client.files.delete(name=uploaded_file.name)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        # Validate and return Pydantic model response
        return ResumeModel.model_validate_json(response.text)

    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)