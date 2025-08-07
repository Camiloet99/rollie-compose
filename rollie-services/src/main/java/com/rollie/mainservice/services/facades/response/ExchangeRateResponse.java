package com.rollie.mainservice.services.facades.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExchangeRateResponse {

    private boolean success;

    private Query query;

    private Info info;

    private Double result;

    private String date;

    private Long timestamp;

    @Data
    public static class Query {
        private String from;
        private String to;
        private Double amount;
    }

    @Data
    public static class Info {
        private Double rate;
    }
}


