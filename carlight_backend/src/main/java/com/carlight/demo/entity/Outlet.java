package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "outlets")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Outlet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
