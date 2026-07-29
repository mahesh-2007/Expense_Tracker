from sqlalchemy import Column , Integer, String , Date, Float
from .database import Base


class DBProduct(Base):
    __tablename__ = "expense"
    id = Column(Integer,  primary_key=True, index=True)
    Amount = Column(Float,nullable=False)
    Date = Column(Date)
    Category = Column(String(50),nullable=False)
    Description = Column(String(200))