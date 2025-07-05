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
    description="Audio analysis and pronunciation scoring - Pure ML, no database",
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
    return {
        "service": "SpeakTrainer ML", 
        "version": "1.0.0",
        "description": "Pure ML service for audio analysis - no database operations"
    }

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
    This is a pure ML endpoint - no database operations.
    """
    # Validate audio file (relaxed for debugging)
    logger.info(f"Received file: {audio_file.filename}, content_type: {audio_file.content_type}")
    
    # Allow common audio file extensions even if MIME type is wrong
    allowed_extensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.webm']
    file_extension = audio_file.filename.lower().split('.')[-1] if audio_file.filename and '.' in audio_file.filename else ''
    
    if audio_file.content_type and not audio_file.content_type.startswith('audio/'):
        if f'.{file_extension}' not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File must be an audio file. Got content_type: {audio_file.content_type}, filename: {audio_file.filename}"
            )
    
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
    Pure ML operation - no database.
    """
    # Validate audio file (relaxed for debugging)
    logger.info(f"Received file: {audio_file.filename}, content_type: {audio_file.content_type}")
    
    # Allow common audio file extensions even if MIME type is wrong
    allowed_extensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.webm']
    file_extension = audio_file.filename.lower().split('.')[-1] if audio_file.filename and '.' in audio_file.filename else ''
    
    if audio_file.content_type and not audio_file.content_type.startswith('audio/'):
        if f'.{file_extension}' not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File must be an audio file. Got content_type: {audio_file.content_type}, filename: {audio_file.filename}"
            )
    
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