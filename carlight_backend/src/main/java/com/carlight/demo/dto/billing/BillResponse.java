package com.carlight.demo.dto.billing;

import com.carlight.demo.entity.PaymentMethod;
import com.carlight.demo.entity.User;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedBy;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BillResponse {

    private Long billId;
    private String invoiceNo;

    private Long outletId;
    private String outletName;

    private String customerName;
    private String phoneNumber;

    private String carNo;
    private  String carType;

    private String packageName;
    private Double packagePrice;

    private List<ExtraItem> extras;
    private List<AdditionalChargeItem> additionalCharges;

    private Double discount;
    private Double totalAmount;

    private String couponCode;
    private Double couponDiscount;


    private PaymentMethod paymentMethod;

    private String createdBy;   // ✅ show staff name/phone
    private LocalDateTime createdAt;

    @Data @Builder
    public static class ExtraItem {
        private Long extraId;
        private String name;
        private Double price;
    }

    @Data @Builder
    public static class AdditionalChargeItem {
        private String title;
        private Double amount;
    }
}

