package com.rollie.mainservice.models.requests;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import lombok.Value;

@Value
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class WatchSearchRequest {
    private String referenceCode;
    private String colorDial;
    private Integer productionYear;
    private String condition;
    private Double minPrice;
    private Double maxPrice;
    private String currency;
    private String watchInfo;
    private Boolean lastDayOnly;
}
