package com.carlight.demo.dto.billing;

import com.carlight.demo.entity.PaymentMethod;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BillYearResponse {
    private Long id;
    private Double totalAmount;
    private Double discount;
    private LocalDateTime createdAt;

    private Long outletId;
    private String outletName;

    private Long carId;
    private String carNo;
    private String carType;

    // ✅ added for analytics (top customers / packages / payment split)
    private String customerName;
    private String phoneNumber;
    private String packageName;
    private PaymentMethod paymentMethod;
    private String couponCode;
}
