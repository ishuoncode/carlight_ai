package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bill_additional_charges")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BillAdditionalCharge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "bill_id")
    private Bill bill;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Double amount;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BillAdditionalCharge)) return false;
        return id != null && id.equals(((BillAdditionalCharge) o).id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

}
