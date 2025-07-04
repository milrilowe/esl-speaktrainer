FROM python:3.10-slim

# Install system dependencies
RUN apt update && apt install -y ffmpeg espeak-ng && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code into the container
COPY app/ .

# Ensure Python can import from current dir
ENV PYTHONPATH=/app

# Run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]