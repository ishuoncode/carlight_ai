package com.carlight.demo.dto.packagee;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WashPackageResponse {
    private Long id;
    private String name;
    private String description;
    private Double defaultPrice;
    private Boolean active;
    private LocalDateTime createdAt;
}
