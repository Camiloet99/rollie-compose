package com.rollie.mainservice.controllers;

import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.models.User;
import com.rollie.mainservice.models.requests.PasswordResetRequest;
import com.rollie.mainservice.models.requests.ResetVerifyRequest;
import com.rollie.mainservice.models.requests.UpdateUserProfileRequest;
import com.rollie.mainservice.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/upgrade")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> upgradeToPremium(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
    @RequestParam Integer planId) {
        String token = authHeader.replace("Bearer ", "");
        return userService.upgradeToPremium(token, planId)
                .map(ControllerUtils::ok);
    }

    @PutMapping("/{userId}/profile")
    public Mono<ResponseEntity<ResponseBody<User>>> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody UpdateUserProfileRequest request
    ) {
        return userService.updateUserProfile(userId, request)
                .map(ControllerUtils::ok);
    }
}