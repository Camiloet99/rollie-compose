# app.py
from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import shutil
import os
from datetime import date
from zoneinfo import ZoneInfo

from database import SessionLocal, engine
from models import Base, Watch
from cleaner_optimized import process_watch_data

app = FastAPI()
Base.metadata.create_all(bind=engine)

TZ = ZoneInfo("America/Bogota")  # misma TZ que usas en el back Java

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/clean-watches/")
async def clean_watches(
    file: UploadFile = File(...),
    asOfDate: str = Form(...),                # NEW: llega como campo de form
    db: Session = Depends(get_db)
):
    # 1) Validar asOfDate (YYYY-MM-DD) y no-futuro
    try:
        as_of = date.fromisoformat(asOfDate)
    except ValueError:
        raise HTTPException(status_code=400, detail="asOfDate must be YYYY-MM-DD")

    if as_of > date.today(TZ):
        raise HTTPException(status_code=400, detail="asOfDate cannot be in the future")

    # 2) Guardar temporal y limpiar con tu pipeline
    os.makedirs("uploads", exist_ok=True)
    temp_path = f"uploads/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    df_cleaned = process_watch_data(temp_path)

    # 3) Insertar en DB incluyendo as_of_date
    errors = []
    success_count = 0
    MAX_COST_ALLOWED = 1_000_000_000

    for index, row in df_cleaned.iterrows():
        try:
            # parseo de precio más robusto que .isdigit()
            raw_price = row.get("Price")
            price_float = float(raw_price) if raw_price and str(raw_price).isdigit() else None
            if price_float and price_float > MAX_COST_ALLOWED:
                raise ValueError(f"Cost too large: {price_float}")

            db_watch = Watch(
                reference_code=row['Reference'],
                color_dial=(row.get('Color') or None),
                watch_condition=(row.get('Condition') or None),
                production_year=parse_year_safe(row.get('Year')),
                cost=price_float,
                currency=(row.get('Currency') or None),
                watch_info=(row.get('Info') or None),
                as_of_date=as_of,                 # NEW: guardamos la fecha aquí
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
        "asOfDate": as_of.isoformat(),          # opcional: eco de la fecha
        "errors": errors
    }

def parse_year_safe(date_val):
    try:
        cleaned = str(date_val).lower().strip().replace('y', '').replace('/', '')
        year = int(cleaned)
        if 1900 <= year <= 2100:
            return year
    except:
        return None
    return None
