# ./python-service/Dockerfile
FROM python:3.11-slim-bookworm

# Instala Java 17 (compatible con Spark 3.5.x) y utilidades
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    curl wget \
    && rm -rf /var/lib/apt/lists/*

# (Opcional) Si quieres setear JAVA_HOME, puedes omitirlo: PySpark usa /usr/bin/java
# ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-$(dpkg --print-architecture)

# Dependencias Python
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
