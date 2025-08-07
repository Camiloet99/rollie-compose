package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Table("user_favorites")
public class UserFavorite {

    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    @Column("reference")
    private String reference;
}
