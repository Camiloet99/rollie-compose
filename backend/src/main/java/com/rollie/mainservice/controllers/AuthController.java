package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.UserEntity;
import com.rollie.mainservice.models.requests.AuthRequest;
import com.rollie.mainservice.models.AuthResponse;
import com.rollie.mainservice.models.requests.PasswordResetRequest;
import com.rollie.mainservice.models.requests.RegisterRequest;
import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.models.requests.ResetVerifyRequest;
import com.rollie.mainservice.services.AuthUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthUserService authUserService;

    @PostMapping("/login")
    public Mono<ResponseEntity<ResponseBody<AuthResponse>>> login(@RequestBody AuthRequest request) {
        log.info("Attempting login for email: {}", request.getEmail());
        return authUserService.login(request)
                .doOnSuccess(response -> log.info("Login successful for email: {}", request.getEmail()))
                .map(ControllerUtils::ok);
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> register(@RequestBody RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());
        return authUserService.register(request)
                .doOnSuccess(result -> log.info("User registered successfully: {}", request.getEmail()))
                .map(ControllerUtils::created);
    }

    @PostMapping("/verify-reset")
    public Mono<ResponseEntity<ResponseBody<UserEntity>>> verifyReset(@RequestBody ResetVerifyRequest request) {
        log.info("Verifying identity for password reset - Email: {}, Phone: {}", request.getEmail(), request.getPhoneNumber());
        return authUserService.verifyIdentity(request.getEmail(), request.getPhoneNumber())
                .doOnSuccess(user -> log.info("Identity verification successful for email: {}", request.getEmail()))
                .map(ControllerUtils::ok);
    }

    @PutMapping("/{userId}/reset-password")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> resetPassword(
            @PathVariable Long userId,
            @RequestBody PasswordResetRequest request
    ) {
        log.info("Resetting password for userId: {}", userId);
        return authUserService.resetPassword(userId, request.getNewPassword())
                .doOnSuccess(result -> log.info("Password reset successful for userId: {}", userId))
                .map(ControllerUtils::ok);
    }
}
