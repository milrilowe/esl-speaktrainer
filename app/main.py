from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.prompts import get_random_prompt, get_prompt_text
from app.analyze import analyze_audio
from app.database import get_db
import tempfile

app = FastAPI()

@app.get("/prompt")
async def prompt(session: AsyncSession = Depends(get_db)):
    prompt = await get_random_prompt(session)
    if not prompt:
        raise HTTPException(status_code=404, detail="No prompts available")
    return {"id": prompt.id, "text": prompt.text}

@app.post("/submission")
async def submission(
    prompt_id: str = Form(...),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db)
):
    prompt_text = await get_prompt_text(session, prompt_id)
    if not prompt_text:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Save uploaded audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        contents = await file.read()
        temp_audio.write(contents)
        temp_path = temp_audio.name

    # Analyze against the prompt
    result = analyze_audio(prompt_text, temp_path)
    return JSONResponse(result)