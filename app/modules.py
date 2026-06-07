from pydantic import BaseModel,Field
from datetime import date
from typing import Optional

class module(BaseModel):
    Amount: float = Field(description="Amount for the specific expense record")
    Date: Optional[date] = Field(default=None, description="Date for the specific expense record")
    Category: str = Field(description="Category for the specific expense record")
    Description: str = Field(description="Description for the specific expense record")
