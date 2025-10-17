-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS rollie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE rollie;

-- Tabla de configuración de aplicación
CREATE TABLE IF NOT EXISTS app_config (
    id VARCHAR(255) PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL,
    value TEXT
);

-- Tabla de entradas de documentos
CREATE TABLE IF NOT EXISTS document_entries (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de carga de documentos
CREATE TABLE IF NOT EXISTS document_upload_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    upload_time DATETIME NOT NULL,
    as_of_date DATE NOT NULL
);

-- Tabla de logs de búsqueda
CREATE TABLE IF NOT EXISTS search_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    timestamp DATETIME,
    reference_code VARCHAR(255),
    success BOOLEAN,
    log_date DATE
);

-- Tabla de planes o tiers
CREATE TABLE IF NOT EXISTS tiers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT,
    active TINYINT(1),
    price FLOAT,
    search_limit INT,
    price_drop_notification TINYINT(1),
    search_history_limit INT,
    price_fluctuation_graph TINYINT(1),
    autocomplete_reference TINYINT(1),
    advanced_search TINYINT(1),
    extra_properties TEXT
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    planId INT,
    phone VARCHAR(20),
    active TINYINT(1) DEFAULT 1
);

-- Tabla de relojes
CREATE TABLE IF NOT EXISTS watches (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    fecha_archivo DATE,
    clean_text TEXT,
    brand VARCHAR(80),
    modelo VARCHAR(60),
    currency VARCHAR(10),
    monto DECIMAL(20,2),
    descuento DECIMAL(7,2),
    monto_final DECIMAL(20,2),
    estado VARCHAR(12),
    condicion VARCHAR(50),
    anio SMALLINT UNSIGNED,
    bracelet VARCHAR(30),
    color VARCHAR(40),

    as_of_date DATE NOT NULL,                -- ← nuevo
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_watches_fecha_archivo (fecha_archivo),
    INDEX idx_watches_modelo (modelo),
    INDEX idx_watches_brand (brand),
    INDEX idx_watches_monto_final (monto_final),
    INDEX idx_watches_as_of_date (as_of_date)
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    reference VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
