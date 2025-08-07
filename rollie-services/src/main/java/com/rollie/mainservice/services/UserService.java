package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.UserEntity;
import com.rollie.mainservice.exceptions.UserNotFoundException;
import com.rollie.mainservice.models.User;
import com.rollie.mainservice.models.requests.UpdateUserProfileRequest;
import com.rollie.mainservice.repository.UserRepository;
import com.rollie.mainservice.security.JwtUtil;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@AllArgsConstructor
@Service
public class UserService {

    JwtUtil jwtUtil;
    UserRepository userRepository;

    public Mono<UserEntity> getUserById(Long userId) {
        return userRepository.findById(userId);
    }

    public Mono<Boolean> upgradeToPremium(String token, Integer planId) {
        String email = jwtUtil.getUsernameFromToken(token);

        return userRepository.findByEmail(email)
                .flatMap(user -> {
                    user.setPlanId(planId);
                    return userRepository.save(user)
                            .thenReturn(true);
                });
    }

    public Mono<User> updateUserProfile(Long userId, UpdateUserProfileRequest request) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new UserNotFoundException(userId)))
                .flatMap(existing -> {
                    existing.setFirstName(request.getFirstName());
                    existing.setLastName(request.getLastName());
                    existing.setPhoneNumber(request.getPhoneNumber());
                    return userRepository.save(existing);
                })
                .map(UserEntity::mapToResponse);
    }
}
