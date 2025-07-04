from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from analyze import analyze_audio
import logging
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SpeakTrainer ML Service",
    description="Audio analysis and pronunciation scoring",
    version="1.0.0"
)

# CORS configuration based on environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"service": "SpeakTrainer ML", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml"}

@app.post("/analyze")
async def analyze_pronunciation(
    expected_text: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """
    Analyze pronunciation by comparing expected text with audio transcription.
    This is a pure ML endpoint that your Go API will call.
    """
    # Validate audio file
    if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    temp_file = None
    try:
        # Save uploaded audio to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            contents = await audio_file.read()
            temp_audio.write(contents)
            temp_file = temp_audio.name
        
        # Analyze pronunciation using your existing function
        result = analyze_audio(expected_text, temp_file)
        
        logger.info(f"Analysis completed for text: '{expected_text}', score: {result.get('score', 0)}")
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {e}")

@app.post("/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...)
):
    """
    Just transcribe audio to text (separate endpoint for flexibility).
    """
    if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            contents = await audio_file.read()
            temp_audio.write(contents)
            temp_file = temp_audio.name
        
        # Import your transcribe function from analyze.py
        from analyze import transcribe
        transcription = transcribe(temp_file)
        
        return {"transcription": transcription}
        
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)