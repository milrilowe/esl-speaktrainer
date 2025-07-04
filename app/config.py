import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Example configuration variables
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
DEBUG = os.getenv('DEBUG', 'true').lower() in ('1', 'true', 'yes')

# Add more config variables as needed 