package com.carlight.demo.repository;

import com.carlight.demo.dto.report.YearlyCarServiceReport;
import com.carlight.demo.dto.customer.CustomerActivityRow;
import com.carlight.demo.entity.Bill;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {



    // ✅ bill by id (NOT deleted) with full relations
    @EntityGraph(attributePaths = {
            "billExtras",
            "createdBy",
            "billExtras.extra",
            "additionalCharges",
            "car",
            "car.owner",
            "outlet",
            "outletPackage",
            "outletPackage.washPackage"
    })
    Optional<Bill> findByIdAndDeletedFalse(Long id);

    // ✅ bill by id (including deleted) for restore
    @EntityGraph(attributePaths = {
            "billExtras",
            "createdBy",
            "billExtras.extra",
            "additionalCharges",
            "car",
            "car.owner",
            "outlet",
            "outletPackage",
            "outletPackage.washPackage"
    })
    Optional<Bill> findWithAllById(Long id);

    // ✅ all bills (NOT deleted)
    @EntityGraph(attributePaths = {
            "createdBy",
            "billExtras",
            "billExtras.extra",
            "additionalCharges",
            "car",
            "car.owner",
            "outlet",
            "outletPackage",
            "outletPackage.washPackage"
    })
    List<Bill> findByDeletedFalseOrderByCreatedAtDesc();



    boolean existsByIdAndDeletedFalse(Long billId);


    List<Bill> findByCreatedByIdAndDeletedFalseOrderByCreatedAtDesc(Long staffId);


    // ✅ outlet bills
    List<Bill> findByOutletIdAndDeletedFalseOrderByCreatedAtDesc(Long outletId);

    // ✅ date range bills
    List<Bill> findByDeletedFalseAndCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    // ✅ date range bills for outlet
    List<Bill> findByOutletIdAndDeletedFalseAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long outletId, LocalDateTime start, LocalDateTime end);

    // ✅ car bills
    List<Bill> findByCarCarNoAndDeletedFalseOrderByCreatedAtDesc(String carNo);

    // ✅ deleted bills list
    List<Bill> findByDeletedTrueOrderByDeletedAtDesc();


//    ----------------------------analyticas bill---------

    // ✅ Monthly total bill amount
    @Query("""
        SELECT COALESCE(SUM(b.totalAmount), 0)
        FROM Bill b
        WHERE year(b.createdAt) = :year
          AND month(b.createdAt) = :month
          AND (:outletId IS NULL OR b.outlet.id = :outletId)
    """)
    Double monthlyTotalBill(
            @Param("year") int year,
            @Param("month") int month,
            @Param("outletId") Long outletId
    );

    // ✅ Yearly total bill amount
    @Query("""
        SELECT COALESCE(SUM(b.totalAmount), 0)
        FROM Bill b
        WHERE year(b.createdAt) = :year
          AND (:outletId IS NULL OR b.outlet.id = :outletId)
    """)
    Double yearlyTotalBill(
            @Param("year") int year,
            @Param("outletId") Long outletId
    );



//     --------------------analytics car serviced ------------------

    @Query("""
        SELECT COUNT(b.id)
        FROM Bill b
        WHERE year(b.createdAt) = :year
          AND month(b.createdAt) = :month
          AND (:outletId IS NULL OR b.outlet.id = :outletId)
    """)
    Long monthlyCarsServiced(
            @Param("year") int year,
            @Param("month") int month,
            @Param("outletId") Long outletId
    );

    @Query("""
        SELECT COUNT(b.id)
        FROM Bill b
        WHERE year(b.createdAt) = :year
          AND (:outletId IS NULL OR b.outlet.id = :outletId)
    """)
    Long yearlyCarsServiced(
            @Param("year") int year,
            @Param("outletId") Long outletId
    );


    @Query("""
        SELECT new com.carlight.demo.dto.report.YearlyCarServiceReport(
            year(b.createdAt),
            COUNT(b.id)
        )
        FROM Bill b
        WHERE b.deleted = false
          AND (:outletId IS NULL OR b.outlet.id = :outletId)
        GROUP BY year(b.createdAt)
        ORDER BY year(b.createdAt)
    """)
    List<YearlyCarServiceReport> carsServicedAllYears(
            @Param("outletId") Long outletId
    );



    @Query("""
        SELECT new com.carlight.demo.dto.customer.CustomerActivityRow(
            c.id, c.name, c.phoneNumber,
            COUNT(b.id),
            COALESCE(SUM(b.totalAmount), 0),
            MIN(b.createdAt),
            MAX(b.createdAt)
        )
        FROM Bill b
        JOIN b.car car
        JOIN car.owner c
        WHERE b.deleted = false
          AND (:outletId IS NULL OR b.outlet.id = :outletId)
        GROUP BY c.id, c.name, c.phoneNumber
        ORDER BY MAX(b.createdAt) DESC
    """)
    List<CustomerActivityRow> customerActivityAggregates(@Param("outletId") Long outletId);

    // ✅ outlet names each customer visited (for activity report enrichment)
    @Query("""
        SELECT c.id, o.name
        FROM Bill b
        JOIN b.car car
        JOIN car.owner c
        JOIN b.outlet o
        WHERE b.deleted = false
          AND (:outletId IS NULL OR o.id = :outletId)
        GROUP BY c.id, o.name
    """)
    List<Object[]> customerOutletBreakdown(@Param("outletId") Long outletId);

    // ✅ eager-fetch relations so the yearly report gets customer/package/payment in ONE query
    @EntityGraph(attributePaths = {
            "car",
            "car.owner",
            "outlet",
            "outletPackage",
            "outletPackage.washPackage"
    })
    @Query("""
    SELECT b FROM Bill b
    WHERE year(b.createdAt) = :year
      AND (:outletId IS NULL OR b.outlet.id = :outletId)
    ORDER BY b.createdAt DESC
""")
    List<Bill> findBillsByYear(
            @Param("year") int year,
            @Param("outletId") Long outletId
    );

}
