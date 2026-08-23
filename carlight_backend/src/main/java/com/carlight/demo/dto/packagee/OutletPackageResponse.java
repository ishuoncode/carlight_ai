package com.carlight.demo.dto.packagee;

import com.carlight.demo.entity.CarType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OutletPackageResponse {

    private Long id;

    private Long outletId;
    private String outletName;

    private Long washPackageId;
    private String washPackageName;

    private CarType carType;

    private Double price;

    private Boolean active;
}
