import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError

# Cadena de conexión
DATABASE_URL = "mysql+pymysql://root:1152225289@rollie-database.cct6oqi0cxnc.us-east-1.rds.amazonaws.com:3306/rollie?charset=utf8mb4"

# Crear engine
engine = create_engine(DATABASE_URL)

# 🔁 Esperar a que MySQL esté listo
MAX_RETRIES = 4
WAIT_SECONDS = 4

for attempt in range(MAX_RETRIES):
    try:
        with engine.connect() as conn:
            print("✅ Conexión a MySQL exitosa.")
            break
    except OperationalError as e:
        print(f"⏳ MySQL no disponible aún, reintentando ({attempt+1}/{MAX_RETRIES})...")
        time.sleep(WAIT_SECONDS)
else:
    raise Exception("❌ No se pudo conectar a MySQL después de varios intentos.")

# Crear sesión y base de modelos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
