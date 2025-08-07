package com.rollie.mainservice.exceptions;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long userId) {
        super("User for Id" + userId + " not found");
    }
}
