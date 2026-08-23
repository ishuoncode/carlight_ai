package com.carlight.demo.dto.auth;


import com.carlight.demo.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phoneNumber;

    private String email; // optional

    @NotBlank
    private String password;

    @NotNull
    private Role role; // ADMIN or CASHIER

    //  only required if role = CASHIER
    private Long outletId;
}
