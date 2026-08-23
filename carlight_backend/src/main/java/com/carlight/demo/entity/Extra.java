package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "extras")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Extra extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;

    @Column(nullable=false)
    private Double price;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
