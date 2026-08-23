package com.carlight.demo.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateStaffPasswordRequest {

    @NotBlank
    private String newPassword;
}
