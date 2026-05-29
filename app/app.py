"""Project: A Local API Expense Tracker You need to prove you can handle data and build an API before you ever touch an LLM.

The Goal: Build a FastAPI backend that connects to a local SQLite or MySQL database.
Features:
Create endpoints to POST a new transaction (Amount, Date, Category, Description).
Create endpoints to GET all transactions, or filter by category/date.
"""

from datetime import date
from fastapi import FastAPI, Depends,HTTPException,status
from sqlalchemy.orm import Session 
from .database import engine, SessionLocal, Base
from .schemas import DBProduct 
from .modules import module as Expense

app = FastAPI()
Base.metadata.create_all(bind = engine)

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

@app.post("/Expense")
def add_expense(adding:Expense,db:SessionLocal = Depends(db_init)):
    if adding.Amount < 0 :
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail="Transfer amount cannot be negative.") 
    new_expense = DBProduct(
        Amount=adding.Amount,
        Category=adding.Category,
        Description=adding.Description,
        Date=date.today())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return "Expense Added Successfully"
    
@app.delete("/delete")
def delete(id :int , db:SessionLocal = Depends(db_init)):
    dele = db.query(DBProduct).filter(DBProduct.id==id).delete()
    if  not dele :
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail=f"ID {id} not found")
    db.commit()
    return "Deleted Successfully"

@app.put("/update")
def update(id :int ,adding:Expense, db:SessionLocal = Depends(db_init)):
    updating = db.query(DBProduct).filter(DBProduct.id==id).update({
        DBProduct.Amount : adding.Amount,
        DBProduct.Category : adding.Category,
        DBProduct.Date : adding.Date,
        DBProduct.Description : adding.Description
     })
    if not updating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail=f"ID {id} Not Found")
    db.commit()
    return "Updated Successfully"

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
        DBProduct.Date : adding.Date,
        DBProduct.Description : adding.Description
     })
    if not updating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail=f"ID {id} Not Found")
    db.commit()
    return "Updated Successfully"
