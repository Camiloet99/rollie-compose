package com.rollie.mainservice.controllers;

import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.models.User;
import com.rollie.mainservice.models.UsersPaginationResponse;
import com.rollie.mainservice.models.requests.UpdateUserRequest;
import com.rollie.mainservice.services.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping("/{userId}")
    public Mono<ResponseEntity<ResponseBody<User>>> getUserById(@PathVariable Long userId) {
        return adminUserService.getUserById(userId)
                .map(ControllerUtils::ok);
    }

    @GetMapping("/users")
    public Mono<ResponseEntity<ResponseBody<UsersPaginationResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return adminUserService.getUsers(page, limit)
                .map(ControllerUtils::ok);
    }

    @PutMapping("/{userId}")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> updateUser(
            @PathVariable Long userId,
            @RequestBody UpdateUserRequest request
    ) {
        return adminUserService.updateUser(userId, request)
                .map(ControllerUtils::ok);
    }

    @PostMapping("/{userId}/deactivate")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> deactivateUser(@PathVariable Long userId) {
        return adminUserService.deactivateUser(userId)
                .map(ControllerUtils::ok);
    }

    @PostMapping("/{userId}/activate")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> activateUser(@PathVariable Long userId) {
        return adminUserService.activateUser(userId)
                .map(ControllerUtils::ok);
    }

}
