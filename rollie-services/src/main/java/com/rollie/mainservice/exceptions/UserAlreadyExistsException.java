package com.rollie.mainservice.exceptions;

public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String email) {
        super("Account already exists for email: " + email);
    }
}