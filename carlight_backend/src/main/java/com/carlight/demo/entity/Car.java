package com.carlight.demo.entity;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cars")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class    Car extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique = true )
    private String carNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CarType carType;

    private String model;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer owner;


    @PrePersist
    @PreUpdate
    private void makeUppercase() {
        if (carNo != null) {
            carNo = carNo.trim().toUpperCase();
        }
    }

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean deleted = false;



}
