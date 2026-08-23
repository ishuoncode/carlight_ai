package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "coupons",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"code"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ outlet nullable
     * - outlet = null => global coupon (any outlet)
     * - outlet != null => coupon only for that outlet
     */
    @ManyToOne
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    /**
     * ✅ car nullable
     * - car = null => coupon for all cars
     * - car != null => coupon for that specific car
     */
    @ManyToOne
    @JoinColumn(name = "car_id")
    private Car car;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;


    @Builder.Default
    @Column(nullable = false)
    private Boolean oncePerCar = false;



    @Column(nullable = false)
    private Double discountValue;

    @Column(nullable = false)
    private LocalDate validTill;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * ✅ optional usage limit
     * large number => basically unlimited
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer maxUses = 999999;

    @Builder.Default
    @Column(nullable = false)
    private Integer usedCount = 0;

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (code != null) code = code.trim().toUpperCase();
    }
}
