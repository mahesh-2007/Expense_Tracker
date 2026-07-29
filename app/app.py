from google import genai
import instructor
from datetime import date
from fastapi import FastAPI, Depends,HTTPException,status
from sqlalchemy.orm import Session 
from .database import engine, SessionLocal, Base
from .schemas import DBProduct 
from .modules import module as Expense
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv()

ai_setup_error = "Unknown Error"
try:
    url = os.getenv("GEMINI_API_KEY")
    gemini_client = genai.Client(api_key=url)
    client = instructor.from_genai(
        client=gemini_client
    )
except Exception as e:
    print(f"AI Setup Error: {e}")
    ai_setup_error = str(e)
    client = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mahesh-2007.github.io", # Your live GitHub Pages URL
        "http://127.0.0.1:8000",         # For local testing
        "http://localhost:8000"          # For local testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind = engine)

class AIRequest(BaseModel):
    query: str


def db_init():
    db = SessionLocal()
    try :
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return "Welcome To The  Expense Tracker"

@app.get("/Show-All")
def show_expense(db:SessionLocal = Depends(db_init)):
    db_show = db.query(DBProduct).filter().all()
    return db_show

@app.post("/ai/parse-expense")
def ai_expense(payload: AIRequest, db:SessionLocal = Depends(db_init)):
    if client is None:
        raise HTTPException(status_code=500, detail=f"AI Setup Failed: {ai_setup_error}. Please ensure packages are installed and GEMINI_API_KEY is set.")

    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                        {
                            "role": "system",
                            "content": (
                                """You are an expert financial data extraction assistant routing data into a backend API. 
                                Your task is to analyze the user's input, think step-by-step to identify the purchase, and output ONLY a valid JSON object matching the requested schema.

                                <rules>
                                * Extract EXACTLY three data points: Amount, Category, and Description.
                                * Assign the category to EXACTLY ONE of the following: Food, Transport, Utilities, Shopping, Entertainment, Misc.
                                * Convert the Amount to a numeric float. Assume USD if no currency is mentioned.
                                * Format the Description strictly in lowercase and keep it under 5 words.
                                </rules>

                                <examples>
                                User: "Spent 15 bucks on an uber to the airport yesterday."
                                Thinking: The user spent $15.00. An Uber is transportation. The item is an uber ride.
                                Result: {"Amount": 15.00, "Category": "Transport", "Description": "uber ride"}

                                User: "Grabbed two lattes for $9.50"
                                Thinking: The user spent $9.50. Lattes are coffee, which falls under Food. The item is two lattes.
                                Result: {"Amount": 9.50, "Category": "Food", "Description": "two lattes"}

                                User: "Just paid my 120 dollar electric bill."
                                Thinking: The user spent $120.00. An electric bill is a utility. The item is an electric bill.
                                Result: {"Amount": 120.00, "Category": "Utilities", "Description": "electric bill"}
                                </examples>"""
                            ) 
                            },
                        {
                            "role": "user", 
                            "content": f"Extract expense data from this text: {payload.query}"
                        }
                    ],
                    response_model=Expense,
                    max_retries=2,
                )
        
        new_expense = DBProduct(
            Amount=response.Amount,
            Category=response.Category,
            Description=response.Description,
            Date=response.Date or date.today())
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)
        return {"message": "Expense Added Successfully via AI"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/Expense")
def add_expense(adding:Expense,db:SessionLocal = Depends(db_init)):
    if adding.Amount < 0 :
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="Transfer amount cannot be negative.") 
    new_expense = DBProduct(
        Amount=adding.Amount,
        Category=adding.Category,
        Description=adding.Description,
        Date=adding.Date or date.today())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return "Expense Added Successfully"
    
@app.delete("/delete/{id}")
def delete(id :int , db:SessionLocal = Depends(db_init)):
    dele = db.query(DBProduct).filter(DBProduct.id==id).delete()
    if  not dele :
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail=f"ID {id} not found")
    db.commit()
    return "Deleted Successfully"

@app.put("/update/{id}")
def update(id :int ,adding:Expense, db:SessionLocal = Depends(db_init)):
    updating = db.query(DBProduct).filter(DBProduct.id==id).update({
        DBProduct.Amount : adding.Amount,
        DBProduct.Category : adding.Category,
        DBProduct.Date : adding.Date or date.today(),
        DBProduct.Description : adding.Description
     })
    if not updating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail=f"ID {id} Not Found")
    db.commit()
    return "Updated Successfully"
