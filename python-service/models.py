from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, func, SmallInteger, Text
from database import Base

class Watch(Base):
    __tablename__ = "watches"

    id            = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha_archivo = Column(Date, index=True, nullable=True)
    clean_text    = Column(Text, nullable=True)                 # texto completo
    brand         = Column(String(100), index=True, nullable=True)
    modelo        = Column(String(100), index=True, nullable=True)
    currency      = Column(String(10), nullable=True)           # "HKD"
    monto         = Column(DECIMAL(20, 2), nullable=True)
    descuento     = Column(DECIMAL(7, 2), nullable=True)
    monto_final   = Column(DECIMAL(20, 2), index=True, nullable=True)
    estado        = Column(String(16), nullable=True)           # ej "n6", "n12"
    condicion     = Column(String(80), nullable=True)           # ej "full set", "used", etc.
    anio          = Column(SmallInteger, nullable=True)
    bracelet      = Column(String(40), nullable=True)           # ej "oyster", "jubilee"
    color         = Column(String(60), nullable=True)

    # Campos externos al archivo (se conservan)
    as_of_date    = Column(Date, index=True, nullable=False)
    created_at    = Column(DateTime, server_default=func.now(), nullable=False)