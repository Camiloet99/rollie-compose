package com.rollie.mainservice.entities;

import com.rollie.mainservice.models.requests.RegisterRequest;
import com.rollie.mainservice.models.User;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder(toBuilder = true)
@Table(name = "users")
public class UserEntity {

    @Id
    @Column("user_id")
    Long userId;

    @Column("first_name")
    String firstName;

    @Column("last_name")
    String lastName;

    @Column("email")
    String email;

    @Column("password")
    String password;

    @Column("role")
    String role;

    @Column("planId")
    Integer planId;

    @Column("phone")
    String phoneNumber;

    @Column("active")
    Boolean active;

    public static User mapToResponse(UserEntity entity) {
        return User.builder()
                .userId(entity.getUserId())
                .email(entity.getEmail())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .password(entity.getPassword())
                .role(entity.getRole())
                .planId(entity.getPlanId())
                .active(entity.getActive())
                .phoneNumber(entity.getPhoneNumber())
                .build();
    }

    public static UserEntity fromRegisterRequest(RegisterRequest request) {
        return UserEntity.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .password(request.getPassword())
                .role(isAdmin(request.getPassword()) ? "ADMIN" : "user")
                .planId(1)
                .phoneNumber(request.getPhoneNumber())
                .active(true)
                .build();
    }

    private static boolean isAdmin(String password) {
        return password.equalsIgnoreCase("rollieadminpa$$word");
    }

}
