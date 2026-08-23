package com.carlight.demo.dto.user;

import com.carlight.demo.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StaffResponse {

    private Long id;
    private String name;
    private String phoneNumber;
    private String email;
    private Role role;

    private Long outletId;
    private String outletName;

    private Boolean active;
    private LocalDateTime createdAt;
}
