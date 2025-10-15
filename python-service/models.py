# models.py
from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, func, Text
from database import Base

class Watch(Base):
    """
    Estructura 1:1 con el DataFrame 'final_total' del script Spark.
    Columnas: ['fecha_archivo','clean_text','brand','modelo','currency','monto',
               'descuento','monto_final','estado','condicion','anio','bracelet','color']
    """
    __tablename__ = "watch_spark_rows"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # === Campos devueltos por el script (mismos nombres) ===
    fecha_archivo = Column(Date, index=True, nullable=True)        # puede venir null si no hay fecha en filename
    clean_text    = Column(Text, nullable=True)                    # texto completo normalizado
    brand         = Column(String(80), index=True, nullable=True)
    modelo        = Column(String(60), index=True, nullable=True)  # 'modelo' del script (no renombrado)
    currency      = Column(String(10), nullable=True)
    monto         = Column(DECIMAL(20, 2), nullable=True)
    descuento     = Column(DECIMAL(7, 2), nullable=True)           # ej. 0–100 con decimales
    monto_final   = Column(DECIMAL(20, 2), index=True, nullable=True)
    estado        = Column(String(12), nullable=True)              # ej. N1..N20
    condicion     = Column(String(50), nullable=True)              # condición ya normalizada
    anio          = Column(Integer, nullable=True)                 # año tal cual sale (int)
    bracelet      = Column(String(30), nullable=True)              # brazalete normalizado
    color         = Column(String(40), nullable=True)              # color normalizado

    # (opcional) trazabilidad
    created_at    = Column(DateTime, server_default=func.now(), nullable=False)
