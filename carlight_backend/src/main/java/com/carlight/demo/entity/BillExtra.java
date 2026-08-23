package com.carlight.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bill_extras")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BillExtra extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @ManyToOne
    @JoinColumn(name = "extra_id", nullable = false)
    private Extra extra;


    @Column(nullable=false)
    private String extraNameSnapshot;

    @Column(nullable=false)
    private Double extraPriceSnapshot;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BillExtra)) return false;
        return id != null && id.equals(((BillExtra) o).id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

}
