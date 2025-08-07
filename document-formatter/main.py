from fastapi import FastAPI, UploadFile, File, Depends
from sqlalchemy.orm import Session
import pandas as pd
import shutil
import os

from database import SessionLocal, engine
from models import Base, Watch
from cleaner_optimized import process_watch_data

app = FastAPI()

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/clean-watches/")
async def clean_watches(file: UploadFile = File(...), db: Session = Depends(get_db)):
    os.makedirs("uploads", exist_ok=True)
    temp_path = f"uploads/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    df_cleaned = process_watch_data(temp_path)

    errors = []
    success_count = 0
    MAX_COST_ALLOWED = 1_000_000_000  # puedes ajustar este umbral
    MAX_REF_LENGTH = 50

    for index, row in df_cleaned.iterrows():
        try:
            raw_price = row.get("Price")
            price_float = float(raw_price) if raw_price and str(raw_price).isdigit() else None
            if price_float and price_float > MAX_COST_ALLOWED:
                raise ValueError(f"Cost too large: {price_float}")

            db_watch = Watch(
                reference_code=row['Reference'],
                color_dial=row.get('Color'),
                watch_condition=row.get('Condition'),
                production_year=parse_year_safe(row.get('Year')),
                cost=price_float,
                currency=row.get('Currency'),
                watch_info=row.get('Info')
            )
            db.add(db_watch)
            success_count += 1

        except Exception as e:
            errors.append({
                "row": index,
                "reference": row.get('Reference', ''),
                "price": row.get('Price', ''),
                "error": str(e)
            })

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return {
            "status": "error_on_commit",
            "rows_saved": success_count,
            "commit_error": str(e),
            "errors": errors
        }

    os.remove(temp_path)

    return {
        "status": "completed_with_errors" if errors else "success",
        "rows_saved": success_count,
        "errors": errors
    }

def parse_year_safe(date_val):
    try:
        # Elimina sufijos tipo 'y', '/', etc. y convierte a entero
        cleaned = str(date_val).lower().strip().replace('y', '').replace('/', '')
        year = int(cleaned)
        # Valida rango razonable para año
        if 1900 <= year <= 2100:
            return year
    except:
        return None
    return None