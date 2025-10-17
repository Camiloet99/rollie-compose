# main.py
from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import shutil
import os
from datetime import date
from zoneinfo import ZoneInfo
from decimal import Decimal, InvalidOperation
import uuid

from database import SessionLocal, engine
from models import Base, Watch

# IMPORTA tu función nueva (el nombre del archivo que pegaste)
from cleaner_optimized import process_watch_data_spark
from brand_codes import get_brand_codes_list

# --- Spark (singleton simple) ---
from pyspark.sql import SparkSession
_SPARK = None
def get_spark() -> SparkSession:
    global _SPARK
    if _SPARK is None:
        _SPARK = (
            SparkSession.builder
            .appName("watch-cleaner")
            .getOrCreate()
        )
    return _SPARK

app = FastAPI()
Base.metadata.create_all(bind=engine)

TZ = ZoneInfo("America/Bogota")

@app.get("/health")
def health():
    return {"status": "ok"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def to_decimal_or_none(x):
    """Convierte a Decimal o None sin romper si viene float/str/NaN."""
    if x is None:
        return None
    try:
        if isinstance(x, float) and pd.isna(x):
            return None
        s = str(x).strip()
        if s == "" or s.lower() in ("none", "nan", "null"):
            return None
        return Decimal(s)
    except (InvalidOperation, ValueError, TypeError):
        return None

def parse_anio_safe(v):
    """Convierte 'anio' a int o None (acepta '2021', '2021.0', etc.)."""
    try:
        s = str(v).strip()
        if s == "" or s.lower() in ("none", "nan", "null"):
            return None
        n = int(float(s))
        if 1900 <= n <= 2100:
            return n
    except Exception:
        return None
    return None

@app.post("/clean-watches/")
async def clean_watches(
    file: UploadFile = File(...),
    asOfDate: str = Form(...),
    db: Session = Depends(get_db)
):
    # 1) Validar asOfDate
    try:
        as_of = date.fromisoformat(asOfDate)
    except ValueError:
        raise HTTPException(status_code=400, detail="asOfDate must be YYYY-MM-DD")

    # 1.1) Validar extensión CSV (la lógica nueva es solo CSV)
    filename = file.filename or f"input_{uuid.uuid4().hex}.csv"
    _, ext = os.path.splitext(filename.lower())
    if ext != ".csv":
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .csv")

    # 2) Guardar temporal
    os.makedirs("uploads", exist_ok=True)
    # Evita colisiones de nombre
    safe_name = f"{uuid.uuid4().short if hasattr(uuid.uuid4(), 'short') else uuid.uuid4().hex}_{os.path.basename(filename)}"
    temp_path = os.path.join("uploads", safe_name)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 3) Ejecutar pipeline Spark (nueva lógica)
        spark = get_spark()
        brand_codes = get_brand_codes_list()  # list[dict] [{"Brand":..., "ref_code_lo":...}]

        df_cleaned = process_watch_data_spark(
            spark=spark,
            input_path=temp_path,
            codes_source=brand_codes,
            return_type="pandas"  # nos facilita la inserción fila a fila
        )

        errors = []
        success_count = 0

        # 4) Insertar 1:1 con el modelo
        for idx, row in df_cleaned.iterrows():
            try:
                payload = {
                    "fecha_archivo": row.get("fecha_archivo") or None,
                    "clean_text":    (row.get("clean_text") or None),
                    "brand":         (row.get("brand") or None),
                    "modelo":        (row.get("modelo") or None),
                    "currency":      (row.get("currency") or None),
                    "monto":         to_decimal_or_none(row.get("monto")),
                    "descuento":     to_decimal_or_none(row.get("descuento")),
                    "monto_final":   to_decimal_or_none(row.get("monto_final")),
                    "estado":        (row.get("estado") or None),
                    "condicion":     (row.get("condicion") or None),
                    "anio":          parse_anio_safe(row.get("anio")),
                    "bracelet":      (row.get("bracelet") or None),
                    "color":         (row.get("color") or None),
                    "as_of_date":    as_of,  # dato externo requerido
                }
                db.add(Watch(**payload))
                success_count += 1
            except Exception as e:
                errors.append({
                    "row": idx,
                    "brand": row.get('brand', ''),
                    "modelo": row.get('modelo', ''),
                    "monto_final": str(row.get('monto_final', '')),
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

        return {
            "status": "completed_with_errors" if errors else "success",
            "rows_saved": success_count,
            "asOfDate": as_of.isoformat(),
            "errors": errors
        }

    finally:
        # 5) Limpieza del archivo temporal
        try:
            os.remove(temp_path)
        except Exception:
            pass
