package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "customers",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"phoneNumber"})
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Customer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;

    @Column(nullable=false, unique = true, length = 15)
    private String phoneNumber;

    @Builder.Default
    @Column(nullable=false)
    private Boolean active = true;

    @PrePersist
    @PreUpdate
    private void normalizePhone() {
        if (phoneNumber != null) {
            phoneNumber = phoneNumber.trim();
        }
        if (name != null) {
            name = name.trim();
        }
    }
}
