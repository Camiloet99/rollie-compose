package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.UserEntity;
import com.rollie.mainservice.exceptions.UserNotFoundException;
import com.rollie.mainservice.models.User;
import com.rollie.mainservice.models.UsersPaginationResponse;
import com.rollie.mainservice.models.requests.UpdateUserRequest;
import com.rollie.mainservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public Mono<User> getUserById(Long userId) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new UserNotFoundException(userId)))
                .map(UserEntity::mapToResponse);
    }

    public Mono<UsersPaginationResponse> getUsers(int page, int limit) {
        Mono<List<User>> userListMono = userRepository.findAll()
                .skip((long) page * limit)
                .take(limit)
                .map(UserEntity::mapToResponse)
                .collectList();

        Mono<Long> userCount = userRepository.count();

        return Mono.zip(userListMono, userCount)
                .map(data -> UsersPaginationResponse.builder()
                        .userList(data.getT1())
                        .totalUsers(data.getT2())
                        .build());
    }

    public Mono<Boolean> updateUser(Long userId, UpdateUserRequest request) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new UserNotFoundException(userId)))
                .flatMap(user -> {
                    UserEntity updated = user.toBuilder()
                            .firstName(request.getFirstName())
                            .lastName(request.getLastName())
                            .email(request.getEmail())
                            .role(request.getRole())
                            .phoneNumber(request.getPhoneNumber())
                            .build();
                    return userRepository.save(updated).thenReturn(true);
                });
    }

    public Mono<Boolean> deactivateUser(Long userId) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new UserNotFoundException(userId)))
                .flatMap(user -> {
                    UserEntity deactivated = user.toBuilder()
                            .active(false)
                            .build();
                    return userRepository.save(deactivated).thenReturn(true);
                });
    }

    public Mono<Boolean> activateUser(Long userId) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new UserNotFoundException(userId)))
                .flatMap(user -> {
                    UserEntity deactivated = user.toBuilder()
                            .active(true)
                            .build();
                    return userRepository.save(deactivated).thenReturn(true);
                });
    }
}