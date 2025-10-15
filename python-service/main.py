# app.py (o main.py)
from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import pandas as pd
import shutil
import os
from datetime import date
from zoneinfo import ZoneInfo

from database import SessionLocal, engine
from models import Base, Watch

# IMPORTA EL NUEVO LIMPIADOR SPARK
from cleaner_optimized import process_watch_data_spark
# IMPORTA LA DATA DE BRANDS
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

    # 2) Guardar temporal
    os.makedirs("uploads", exist_ok=True)
    temp_path = f"uploads/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 3) Ejecutar nuevo pipeline Spark
        spark = get_spark()
        brand_codes = get_brand_codes_list()  # list[dict] con Brand/ref_code_lo

        # Retornamos en Pandas para reusar fácilmente el bucle de inserción
        df_cleaned = process_watch_data_spark(
            spark=spark,
            input_source=temp_path,          # <- ahora pasa la ruta del archivo subido
            codes_source=brand_codes,        # <- la lista de brands
            return_type="pandas"             # <- Pandas para insertar registro x registro
        )

        # df_cleaned columnas esperadas (nuevo script):
        # ['fecha_archivo','clean_text','brand','modelo','currency','monto',
        #  'descuento','monto_final','estado','condicion','anio','bracelet','color']

        # 4) Mapear a columnas del modelo Watch
        #    - reference_code     <- modelo
        #    - brand              <- brand (NUEVA columna en el modelo)
        #    - color_dial         <- color
        #    - watch_condition    <- condicion
        #    - production_year    <- anio (entero)
        #    - cost               <- monto_final (decimal)
        #    - currency           <- currency
        #    - bracelet           <- bracelet (NUEVA)
        #    - estado             <- estado (NUEVA)
        #    - watch_info         <- string compacto opcional

        errors = []
        success_count = 0
        MAX_COST_ALLOWED = 1_000_000_000

        # Helper simple para year
        def parse_year_safe(date_val):
            try:
                cleaned = str(date_val).lower().strip().replace('y', '').replace('/', '')
                year = int(float(cleaned))  # por si viene '2021.0'
                if 1900 <= year <= 2100:
                    return year
            except:
                return None
            return None

        # Construimos watch_info compacto igual que antes (puedes cambiarlo)
        def build_watch_info(row) -> str:
            parts = []
            if pd.notnull(row.get("estado")) and str(row.get("estado")).strip():
                parts.append(f"estado:{row['estado']}")
            if pd.notnull(row.get("bracelet")) and str(row.get("bracelet")).strip():
                parts.append(f"bracelet:{row['bracelet']}")
            if pd.notnull(row.get("condicion")) and str(row.get("condicion")).strip():
                parts.append(f"cond:{row['condicion']}")
            info = ", ".join(parts)
            return info[:255] if info else None  # por seguridad

        for index, row in df_cleaned.iterrows():
            try:
                cost_val = row.get("monto_final")
                # Si no hubiese monto_final, usamos 'monto'
                if pd.isna(cost_val):
                    cost_val = row.get("monto")

                price_float = float(cost_val) if cost_val is not None else None
                if price_float and price_float > MAX_COST_ALLOWED:
                    raise ValueError(f"Cost too large: {price_float}")

                db_watch = Watch(
                    reference_code     = (row.get('modelo') or None),
                    brand              = (row.get('brand') or None),
                    color_dial         = (row.get('color') or None),
                    watch_condition    = (row.get('condicion') or None),
                    production_year    = parse_year_safe(row.get('anio')),
                    cost               = price_float,
                    currency           = (row.get('currency') or None),
                    bracelet           = (row.get('bracelet') or None),
                    estado             = (row.get('estado') or None),
                    watch_info         = build_watch_info(row),
                    as_of_date         = as_of,
                )
                db.add(db_watch)
                success_count += 1

            except Exception as e:
                errors.append({
                    "row": index,
                    "reference": row.get('modelo', ''),
                    "price": str(row.get('monto_final', '')),
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
        except:
            pass
