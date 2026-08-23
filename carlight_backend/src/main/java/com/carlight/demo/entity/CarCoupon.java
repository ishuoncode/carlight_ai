package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "car_coupons",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"coupon_id", "car_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarCoupon extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @ManyToOne
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    // optional but useful
    @ManyToOne
    @JoinColumn(name = "bill_id")
    private Bill bill;
}

