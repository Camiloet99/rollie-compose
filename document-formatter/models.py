from sqlalchemy import Column, Integer, String, SmallInteger, DECIMAL, DateTime, func
from database import Base

class Watch(Base):
    __tablename__ = "watches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reference_code = Column(String(50), nullable=False)
    color_dial = Column(String(50))
    production_year = Column(SmallInteger)
    watch_condition = Column(String(50))
    cost = Column(DECIMAL(20, 2))
    currency = Column(String(10))
    created_at = Column(DateTime, server_default=func.now())
    watch_info = Column(String(55))
