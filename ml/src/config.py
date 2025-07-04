import os
from typing import List
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Settings:
    # Environment
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')
    DEBUG: bool = os.getenv('DEBUG', 'true').lower() in ('1', 'true', 'yes')
    
    # CORS Origins
    @property
    def CORS_ORIGINS(self) -> List[str]:
        if self.ENVIRONMENT == 'production':
            # In production, use specific domains from environment
            origins_str = os.getenv('CORS_ORIGINS', '')
            if not origins_str:
                raise ValueError("CORS_ORIGINS must be set in production environment")
            return [origin.strip() for origin in origins_str.split(',')]
        else:
            # In development, allow local development servers
            return [
                "http://localhost:3000",    # Client
                "http://localhost:8000",    # API
                "http://127.0.0.1:3000",
                "http://127.0.0.1:8000",
            ]
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # ML Model settings
    WHISPER_MODEL_SIZE: str = os.getenv('WHISPER_MODEL_SIZE', 'base')
    
    # File upload limits
    MAX_UPLOAD_SIZE: int = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))  # 10MB default

settings = Settings()