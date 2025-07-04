from faster_whisper import WhisperModel
import soundfile as sf
import subprocess
from utils import diff_phonemes

model = WhisperModel("base", compute_type="int8")

def transcribe(audio_path):
    segments, _ = model.transcribe(audio_path)
    return "".join([seg.text for seg in segments]).strip()

def get_phonemes(text):
    cmd = ["espeak-ng", "-q", "--ipa=3", text]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)
    return result.stdout.strip()

def analyze_audio(expected_text, audio_path):
    transcript = transcribe(audio_path)
    expected_phonemes = get_phonemes(expected_text)
    actual_phonemes = get_phonemes(transcript)
    diff = diff_phonemes(expected_phonemes, actual_phonemes)
    score = int((diff.count("✅") / len(diff)) * 100) if diff else 0
    return {
        "transcription": transcript,
        "expected_phonemes": expected_phonemes,
        "actual_phonemes": actual_phonemes,
        "diff": diff,
        "score": score
    }