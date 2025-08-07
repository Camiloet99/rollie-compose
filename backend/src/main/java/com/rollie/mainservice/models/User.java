package com.rollie.mainservice.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.rollie.mainservice.entities.UserEntity;
import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class User {

    Long userId;
    String firstName;
    String lastName;
    String email;
    String password;
    String phoneNumber;
    String role;
    Integer planId;
    Boolean active;

    public UserEntity toEntity() {
        return UserEntity.builder()
                .userId(this.getUserId())
                .firstName(this.getFirstName())
                .lastName(this.getLastName())
                .email(this.getEmail())
                .password(this.getPassword())
                .phoneNumber(this.getPhoneNumber())
                .build();
    }
}
