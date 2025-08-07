package com.rollie.mainservice.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("document_entries")
public class DocumentEntryEntity {

    @Id
    private Long id;

    private String content;

    @Column("created_at")
    private LocalDateTime createdAt;

}
