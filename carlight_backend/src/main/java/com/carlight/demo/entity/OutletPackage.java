package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "outlet_packages",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"outlet_id", "wash_package_id", "car_type"})
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OutletPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @ManyToOne
    @JoinColumn(name = "wash_package_id", nullable = false)
    private WashPackage washPackage;

    @Enumerated(EnumType.STRING)
    @Column(name = "car_type", nullable = false)
    private CarType carType;

    @Column(nullable = false)
    private Double price;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
