# Resume & Document Parser using Google Gemini API

A lightweight Python script that leverages the Google GenAI SDK (`gemini-3.8-flash`) and Pydantic to extract structured, validated JSON data from resumes and documents (PDF, DOCX, TXT).

---

## Features

* **File Upload Support:** Automatically uploads your resume or document to the Gemini Files API for processing.
* **Strict Schema Validation:** Uses **Pydantic** to enforce a rigid schema, ensuring the returned output matches your exact data structure (name, contact, skills, experience, education, and score).
* **Built-in Retry Logic:** Automatically catches temporary server busy errors (`503 / UNAVAILABLE`) and retries with an exponential backoff.
* **Automatic Cleanup:** Safely deletes uploaded files from Gemini servers immediately after processing is complete.

---

## Prerequisites

* Python 3.10 or higher
* A [Google Gemini API Key](https://aistudio.google.com/)

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/haris-byte/Resume-analyzing-Python-Script-.git](https://github.com/haris-byte/Resume-analyzing-Python-Script-.git)
   cd Resume-analyzing-Python-Script-
