package com.carlight.demo.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TotalBillResponse {
    private Double totalBillAmount;
}
