from pydantic import BaseModel
from datetime import date

class module(BaseModel):
    Amount:int
    Date: date
    Category:str
    Description:str
