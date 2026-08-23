package com.carlight.demo.repository;

import com.carlight.demo.dto.expense.ExpensePieResponse;
import com.carlight.demo.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByOutletId(Long outletId);
    List<Expense> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
    // ✅ Date range (particular outlet)
    List<Expense> findByOutlet_IdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long outletId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
    SELECT new com.carlight.demo.dto.expense.ExpensePieResponse(
        e.category,
        SUM(e.amount)
    )
    FROM Expense e
    WHERE year(e.createdAt) = :year
      AND month(e.createdAt) = :month
      AND (:outletId IS NULL OR e.outlet.id = :outletId)
    GROUP BY e.category
""")
    List<ExpensePieResponse> monthlyCategoryPie(
            @Param("year") int year,
            @Param("month") int month,
            @Param("outletId") Long outletId
    );

//    ---------------Yearly----------------------------
@Query("""
    SELECT new com.carlight.demo.dto.expense.ExpensePieResponse(
        e.category,
        SUM(e.amount)
    )
    FROM Expense e
    WHERE year(e.createdAt) = :year
      AND (:outletId IS NULL OR e.outlet.id = :outletId)
    GROUP BY e.category
""")
List<ExpensePieResponse> yearlyCategoryPie(
        @Param("year") int year,
        @Param("outletId") Long outletId
);

}
