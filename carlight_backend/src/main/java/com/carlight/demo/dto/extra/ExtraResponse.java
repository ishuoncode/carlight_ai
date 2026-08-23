package com.carlight.demo.dto.extra;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExtraResponse {
    private Long id;
    private String name;
    private Double price;
    private Boolean active;
}
