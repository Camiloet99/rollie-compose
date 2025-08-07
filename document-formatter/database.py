from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cadena de conexión equivalente a la que usas en Spring
DATABASE_URL = "mysql+pymysql://root:1152225289@localhost:3306/rollie"

# Crear engine SQLAlchemy
engine = create_engine(DATABASE_URL)

# Sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base de modelos
Base = declarative_base()
