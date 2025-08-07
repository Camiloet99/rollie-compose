package com.rollie.mainservice.models.requests;

import lombok.Data;

@Data
public class PasswordResetRequest {
    private String newPassword;
}