from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase,sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")

engine = create_engine(url)

class Base(DeclarativeBase):
    pass

SessionLocal = sessionmaker(autocommit=False , autoflush=False , bind=engine)