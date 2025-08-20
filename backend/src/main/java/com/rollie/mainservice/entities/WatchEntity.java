package com.rollie.mainservice.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

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

    @Column("reference_code")
    private String referenceCode;

    @Column("color_dial")
    private String colorDial;

    @Column("production_year")
    private Integer productionYear;

    @Column("watch_condition")
    private String condition;

    private Double cost;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("currency")
    private String currency;

    @Column("watch_info")
    private String extraInfo;

    @Column("as_of_date")
    private LocalDate asOfDate;

}