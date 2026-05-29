# Local API Expense Tracker

A production-ready FastAPI backend application that connects to a local database using SQLAlchemy ORM. This API lets you seamlessly log, view, update, and track daily financial transactions.

## 🚀 Features

- **Full CRUD Support**: Complete endpoints to Create, Read, Update, and Delete expenses.
- **Robust Path Constraints**: Clean, industry-standard RESTful paths (`/delete/{id}` and `/update/{id}`) for precise data handling.
- **Strict Data Validation**: Built-in protection against bad inputs (e.g., blocking negative monetary amounts with `HTTP 400 Bad Request`).
- **Graceful Error Handling**: Bulletproof checking for non-existent IDs returning standard `HTTP 404 Not Found` errors.
- **Automated Schema Generation**: The application automatically handles table generation within your target SQLite/MySQL database on startup.
- **Interactive API Documentation**: Out-of-the-box Swagger UI documentation for manual exploration and rapid testing.

---

## 📂 Project Structure

```text
my_project/
├── app/
│   ├── main.py          # Application entry point & API endpoints
│   ├── database.py      # Database engine setup and SessionLocal factory
│   ├── schemas.py       # SQLAlchemy ORM Models (DBProduct)
│   └── modules.py       # Pydantic validation schemas (Expense)
├── README.md
└── requirements.txt