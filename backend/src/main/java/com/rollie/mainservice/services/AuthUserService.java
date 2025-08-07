package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.UserEntity;
import com.rollie.mainservice.exceptions.UserAlreadyExistsException;
import com.rollie.mainservice.models.requests.AuthRequest;
import com.rollie.mainservice.models.AuthResponse;
import com.rollie.mainservice.models.requests.RegisterRequest;
import com.rollie.mainservice.repository.UserRepository;
import com.rollie.mainservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AuthUserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public Mono<AuthResponse> login(AuthRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .filter(userDetails -> passwordEncoder.matches(request.getPassword(), userDetails.getPassword()))
                .map(userDetails -> {
                    String token = jwtUtil.generateToken(userDetails.getEmail());
                    return AuthResponse.builder()
                            .user(UserEntity.mapToResponse(userDetails))
                            .token(token)
                            .build();
                })
                .switchIfEmpty(Mono.error(new BadCredentialsException(request.getEmail())));
    }

    public Mono<Boolean> register(RegisterRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .hasElement()
                .flatMap(exists -> {
                    if (Boolean.TRUE.equals(exists)) {
                        return Mono.error(new UserAlreadyExistsException(request.getEmail()));
                    } else {
                        return userRepository.save(UserEntity.fromRegisterRequest(request)
                                        .toBuilder()
                                        .password(passwordEncoder.encode(request.getPassword()))
                                        .build())
                                .map(ignore -> true);
                    }
                });
    }

    public Mono<UserEntity> verifyIdentity(String email, String phoneNumber) {
        return userRepository.findByEmail(email)
                .filter(user -> user.getPhoneNumber().equals(phoneNumber));
    }

    public Mono<Boolean> resetPassword(Long userId, String newPassword) {
        return userRepository.findById(userId)
                .flatMap(user -> {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    return userRepository.save(user);
                })
                .map(saved -> true)
                .defaultIfEmpty(false);
    }
}