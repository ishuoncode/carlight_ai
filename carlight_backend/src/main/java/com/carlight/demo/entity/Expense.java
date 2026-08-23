package com.carlight.demo.entity;

import com.carlight.demo.entity.BaseEntity;
import com.carlight.demo.entity.ExpenseCategory;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "expenses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Expense extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Column(nullable=false)
    private String title;

    @Column(nullable=false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private ExpenseCategory category;

    private String notes;

    @ManyToOne
    @JoinColumn(name = "added_by_user_id", nullable = false)
    private User addedBy;
}
