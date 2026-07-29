from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL", "sqlite:///./expense.db")

if url.startswith("sqlite"):
    engine = create_engine(url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        url, 
        pool_pre_ping=True,
        connect_args={"ssl": {"ssl_mode": "REQUIRED"}}
    )

class Base(DeclarativeBase):
    pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)