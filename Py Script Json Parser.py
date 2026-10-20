import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

# Load environment variables from .env file
load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GEMINI_API_KEY not found! Please check your .env file.")

# 1. Define Strict Pydantic Schema for Resumes
class ExperienceItem(BaseModel):
    company: str = Field(description="Name of the employer or company")
    role: str = Field(description="Job title held by the candidate")
    duration: str = Field(description="Time period worked, e.g., '2022 - 2024' or 'Jan 2023 - Present'")
    key_responsibilities: List[str] = Field(description="Bullet points of key duties or achievements")

class ResumeModel(BaseModel):
    full_name: str = Field(description="Candidate's full name")
    email: str = Field(description="Candidate's email address")
    phone: Optional[str] = Field(description="Candidate's phone number if available")
    skills: List[str] = Field(description="Extracted technical and soft skills")
    experience: List[ExperienceItem] = Field(description="Chronological work history")
    education: List[str] = Field(description="Degrees, universities, and graduation years")
    overall_fit_score: int = Field(description="Estimated score from 1-100 based on general professional quality")

def parse_resume_file(file_path: str, max_retries: int = 3) -> ResumeModel:
    """
    Uploads a real document file to Gemini and extracts structured JSON using Pydantic,
    with built-in retry logic for temporary 503 server errors.
    """
    client = genai.Client()

    print(f"\nUploading '{file_path}' to Gemini Files API...")
    uploaded_file = client.files.upload(file=file_path)

    prompt = """
    You are an expert HR recruiter and technical talent evaluator. Analyze the attached document 
    and extract structured profile data matching the requested schema.

    Here are examples of how specific fields should be extracted:
    
    [Example 1 - Skills Extraction]
    Input snippet: "Proficient in Python, FastAPI, Docker, and AWS cloud infrastructure."
    Extracted skills: ["Python", "FastAPI", "Docker", "AWS"]

    [Example 2 - Experience Extraction]
    Input snippet: "Software Engineer at TechCorp (2021-2023): Built microservices handling 10k RPS."
    Extracted experience: {{
        "company": "TechCorp",
        "role": "Software Engineer",
        "duration": "2021-2023",
        "key_responsibilities": ["Built microservices handling 10k RPS"]
    }}

    Now, process the provided document following these exact rules and output valid JSON.
    """

    response = None
    delay = 3  # Initial delay in seconds for retry

    for attempt in range(1, max_retries + 1):
        try:
            print(f"Sending request to Gemini (Attempt {attempt}/{max_retries})...")
            response = client.models.generate_content(
                model='gemini-3.8-flash',
                contents=[uploaded_file, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ResumeModel,
                    temperature=0.1,
                ),
            )
            break  # Success! Exit loop.
        except Exception as e:
            if "503" in str(e) or "UNAVAILABLE" in str(e):
                if attempt == max_retries:
                    client.files.delete(name=uploaded_file.name)
                    raise e
                print(f"[Warning] Server is busy (503). Retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                client.files.delete(name=uploaded_file.name)
                raise e

    # Clean up file from Gemini servers after processing
    client.files.delete(name=uploaded_file.name)

    # Validate and return Pydantic object
    return ResumeModel.model_validate_json(response.text)

if __name__ == "__main__":
    print("==================================================")
    print("      Gemini AI Document & Resume Parser          ")
    print("==================================================")
    
    user_input = input("Enter the path to your document (PDF, DOCX, TXT): ").strip()
    file_path = user_input.strip('"').strip("'")
    
    if not os.path.exists(file_path):
        print(f"\n[Error] The file '{file_path}' could not be found. Please check the path and try again.")
    else:
        try:
            parsed_resume = parse_resume_file(file_path)
            
            print("\n==================================================")
            print("Successfully Parsed & Validated JSON Output:")
            print("==================================================")
            print(parsed_resume.model_dump_json(indent=2))
            
        except Exception as e:
            print(f"\n[Error] An error occurred during parsing: {e}")