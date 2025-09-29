import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "RTRWH Assessment API"
    PROJECT_VERSION: str = "1.0.0"
    
    # SQLite database configuration
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", "rtrwh_assessment.db")
    DATABASE_URL: str = f"sqlite:///{SQLITE_DB_PATH}"
    
    # External API keys (for rainfall, geocoding, etc.)
    GEOCODING_API_KEY: str = os.getenv("GEOCODING_API_KEY", "")
    RAINFALL_API_KEY: str = os.getenv("RAINFALL_API_KEY", "")
    
    # ML model paths
    RECOMMENDATION_MODEL_PATH: str = os.getenv("RECOMMENDATION_MODEL_PATH", "models/recommendation_model.pkl")

settings = Settings()