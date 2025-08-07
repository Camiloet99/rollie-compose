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
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    content TEXT,
    created_at DATETIME
);

-- Tabla de logs de carga de documentos
CREATE TABLE document_upload_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255),
    upload_time DATETIME
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
    active BOOLEAN,
    price FLOAT,
    search_limit INT,
    price_drop_notification BOOLEAN,
    search_history_limit INT,
    price_fluctuation_graph BOOLEAN,
    autocomplete_reference BOOLEAN,
    advanced_search BOOLEAN,
    extra_properties JSON
);

-- Tabla de usuarios
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(100),
    planId INT,
    phone VARCHAR(50),
    active BOOLEAN
);

-- Tabla de relojes
CREATE TABLE watches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reference_code VARCHAR(255),
    color_dial VARCHAR(100),
    production_year INT,
    watch_condition VARCHAR(100),
    cost DOUBLE,
    created_at DATETIME,
    currency VARCHAR(10),
    watch_info TEXT
);
