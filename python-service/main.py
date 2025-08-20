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
    MAX_COST_ALLOWED = 30_000_000
    MAX_REF_LENGTH = 50

    for index, row in df_cleaned.iterrows():
        try:
            raw_price = row.get("Price")
            price_float = parse_price_safe(raw_price)
            if price_float is not None and price_float > MAX_COST_ALLOWED:
                raise ValueError(f"Cost too large: {price_float}")

            ref = (row.get('Reference') or '').strip()
            if not ref or len(ref) > MAX_REF_LENGTH:
                raise ValueError("Invalid Reference")

            db_watch = Watch(
                reference_code=ref,
                color_dial=(row.get('Color') or None),
                watch_condition=(row.get('Condition') or None),
                production_year=parse_year_safe(row.get('Year')),
                cost=price_float,
                currency=(row.get('Currency') or None),
                watch_info=(row.get('Info') or None),
                as_of_date=as_of,                 
            )
            db.add(db_watch)
            success_count += 1

        except Exception as e:
            errors.append({
                "row": int(index),
                "reference": row.get('Reference', ''),
                "price": row.get('Price', ''),
                "error": str(e)
            })

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        os.remove(temp_path)
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
        year = int(float(cleaned))  # por si viene "2020.0"
        if 1900 <= year <= 2100:
            return year
    except:
        return None
    return None

def parse_price_safe(val):
    """
    Acepta strings con separadores comunes, convierte a float o None.
    Ejemplos válidos: "1200", "1,200.50", "1.200,50" (según origen),
    """
    if val is None:
        return None
    s = str(val).strip()
    if s == "":
        return None
    try:
        # heurística simple: si tiene coma y punto, normalizar a notación con punto decimal
        if "," in s and "." in s:
            # asume separador de miles = coma, decimal = punto (1,234.56)
            s = s.replace(",", "")
            return float(s)
        if "," in s and "." not in s:
            # asume decimal = coma (1234,56) -> 1234.56
            s = s.replace(".", "")
            s = s.replace(",", ".")
            return float(s)
        # caso normal
        return float(s)
    except:
        return None
