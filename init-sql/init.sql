-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS rollie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE rollie;

-- Tabla de configuración de aplicación
CREATE TABLE app_config (
    id VARCHAR(255) PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL,
    value TEXT
);

-- Tabla de entradas de documentos
CREATE TABLE document_entries (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de carga de documentos
CREATE TABLE document_upload_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    upload_time DATETIME NOT NULL
);

-- Tabla de logs de búsqueda
CREATE TABLE search_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    timestamp DATETIME,
    reference_code VARCHAR(255),
    success BOOLEAN,
    log_date DATE
);

-- Tabla de planes o tiers
CREATE TABLE tiers (
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
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    planId INT,
    phone VARCHAR(20),
    active TINYINT(1) DEFAULT 1
);

-- Tabla de relojes
CREATE TABLE watches (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    reference_code VARCHAR(50) NOT NULL,
    color_dial VARCHAR(50),
    production_year SMALLINT UNSIGNED,
    watch_condition VARCHAR(50),
    cost DECIMAL(20,2),
    currency VARCHAR(10),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    watch_info VARCHAR(60)
);

-- Tabla de favoritos
CREATE TABLE user_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    reference VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
