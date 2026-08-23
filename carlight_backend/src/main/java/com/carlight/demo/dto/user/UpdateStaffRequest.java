package com.carlight.demo.dto.user;

import com.carlight.demo.entity.Role;
import lombok.Data;

@Data
public class UpdateStaffRequest {

    private String name;
    private Role role;
    private Long outletId;
    private Boolean active;
}
