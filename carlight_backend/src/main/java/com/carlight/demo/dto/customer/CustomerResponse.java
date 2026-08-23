package com.carlight.demo.dto.customer;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustomerResponse {
    private Long id;
    private String name;
    private String phoneNumber;
    private Boolean active;
    private LocalDateTime createdAt;
}
