package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wash_packages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WashPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique = true)
    private String name;

    private String description;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
