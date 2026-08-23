package com.carlight.demo.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private long id;
    private String token;
    private String role;
    private Long outletId;
    private String name;
    private String phoneNumber;
}
