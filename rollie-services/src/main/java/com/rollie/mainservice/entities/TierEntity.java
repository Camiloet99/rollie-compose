package com.rollie.mainservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("tiers")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TierEntity {

    @Id
    private Long id;

    @Column("name")
    private String name;

    @Column("description")
    private String description;

    @Column("active")
    private Boolean active;

    @Column("price")
    private Float price;

    @Column("search_limit")
    private Integer searchLimit; // Usa -1 para "Unlimited"

    @Column("price_drop_notification")
    private Boolean priceDropNotification;

    @Column("search_history_limit")
    private Integer searchHistoryLimit;

    @Column("price_fluctuation_graph")
    private Boolean priceFluctuationGraph;

    @Column("autocomplete_reference")
    private Boolean autocompleteReference;

    @Column("advanced_search")
    private Boolean advancedSearch;

    // Se guarda como JSON string
    @Column("extra_properties")
    private String extraProperties;
}
