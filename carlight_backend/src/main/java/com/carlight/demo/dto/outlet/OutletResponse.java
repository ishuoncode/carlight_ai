package com.carlight.demo.dto.outlet;

import com.carlight.demo.dto.packagee.OutletPackageResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OutletResponse {
    private Long id;
    private String name;
    private String address;
    private Boolean active;
    private LocalDateTime createdAt;

    // ✅ include pricing rows
    private List<OutletPackageResponse> packages;
}
