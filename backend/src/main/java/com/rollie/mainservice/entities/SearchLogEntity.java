package com.rollie.mainservice.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("search_logs")
public class SearchLogEntity {
    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    @Column("timestamp")
    private LocalDateTime timestamp;

    @Column("reference_code")
    private String referenceCode;

    @Column("success")
    private Boolean success;

    @Column("log_date")
    private LocalDate logDate;

}
