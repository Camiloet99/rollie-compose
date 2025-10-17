package com.rollie.mainservice.entities;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("watches")
public class WatchEntity {

    @Id
    private Long id;

    @Column("fecha_archivo")
    private LocalDate fechaArchivo;        // DATE

    @Column("clean_text")
    private String cleanText;              // TEXT

    @Column("brand")
    private String brand;                  // VARCHAR(80)

    @Column("modelo")
    private String modelo;                 // VARCHAR(60)

    @Column("currency")
    private String currency;               // VARCHAR(10)

    @Column("monto")
    private BigDecimal monto;              // DECIMAL(20,2)

    @Column("descuento")
    private BigDecimal descuento;          // DECIMAL(7,2)

    @Column("monto_final")
    private BigDecimal montoFinal;         // DECIMAL(20,2)

    @Column("estado")
    private String estado;                 // VARCHAR(12)

    @Column("condicion")
    private String condicion;              // VARCHAR(50)

    @Column("anio")
    private Integer anio;                  // SMALLINT UNSIGNED -> Integer

    @Column("bracelet")
    private String bracelet;               // VARCHAR(30)

    @Column("color")
    private String color;                  // VARCHAR(40)

    @Column("as_of_date")
    private LocalDate asOfDate;            // DATE (NOT NULL en DB)

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;       // DATETIME (DEFAULT CURRENT_TIMESTAMP)
}
