package com.rollie.mainservice.models;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UsersPaginationResponse {

    List<User> userList;
    Long totalUsers;

}
