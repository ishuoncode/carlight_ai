package com.carlight.demo.entity;

import com.carlight.demo.entity.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "bills")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Bill extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceNo;


    @ManyToOne
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @ManyToOne
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @ManyToOne
    @JoinColumn(name = "outlet_package_id", nullable = true)
    private OutletPackage outletPackage;


    @Builder.Default
    @Column(nullable = true)
    private Double packagePriceSnapshot = 0.0;

    @Builder.Default
    @Column(nullable=false)
    private Double discount = 0.0;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<BillExtra> billExtras = new HashSet<>();

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<BillAdditionalCharge> additionalCharges = new HashSet<>();



    @Column(nullable=false)
    private Double totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private PaymentMethod paymentMethod;

    // cashier who created bill
    @ManyToOne
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Builder.Default
    @Column(nullable = false)
    private Boolean deleted = false;

    private LocalDateTime deletedAt;

    @ManyToOne
    @JoinColumn(name = "deleted_by_user_id")
    private User deletedBy;

    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(name = "coupon_code_snapshot")
    private String couponCodeSnapshot;

    @Column(name = "coupon_discount_snapshot")
    private Double couponDiscountSnapshot;

}
