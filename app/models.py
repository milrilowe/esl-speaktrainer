from sqlalchemy import Column, String
from app.database import Base

class Prompt(Base):
    __tablename__ = "prompts"
    id = Column(String, primary_key=True)
    text = Column(String, nullable=False)