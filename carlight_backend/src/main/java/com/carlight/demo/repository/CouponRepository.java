package com.carlight.demo.repository;

import com.carlight.demo.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    boolean existsByCodeIgnoreCase(String code);

    Optional<Coupon> findByCodeIgnoreCase(String code);

    // ✅ for billing: find possible coupons by code
    List<Coupon> findByCodeIgnoreCaseAndActiveTrueAndValidTillGreaterThanEqual(
            String code,
            LocalDate today
    );


//    find best coupon
@Query("""
    select c from Coupon c
    where UPPER(c.code) = UPPER(:code)
      and c.active = true
      and c.validTill >= :today
      and c.usedCount < c.maxUses
      and (
          (c.outlet.id = :outletId and c.car.id = :carId)
          or (c.outlet is null and c.car.id = :carId)
          or (c.outlet.id = :outletId and c.car is null)
          or (c.outlet is null and c.car is null)
      )
    order by
      case
        when (c.outlet.id = :outletId and c.car.id = :carId) then 1
        when (c.outlet is null and c.car.id = :carId) then 2
        when (c.outlet.id = :outletId and c.car is null) then 3
        when (c.outlet is null and c.car is null) then 4
        else 99
      end,
      c.createdAt desc
    """)
List<Coupon> findBestCouponForBill(
        @Param("code") String code,
        @Param("outletId") Long outletId,
        @Param("carId") Long carId,
        @Param("today") LocalDate today
);

//egilible coupon for billing
@Query("""
select c from Coupon c
where c.active = true
  and c.validTill >= :today
  and c.usedCount < c.maxUses

  and (
        c.oncePerCar = false
        or not exists (
            select 1 from CarCoupon cc
            where cc.coupon.id = c.id
              and cc.car.id = :carId
        )
  )

  and (
      (c.outlet.id = :outletId and c.car.id = :carId)
      or (c.outlet is null and c.car.id = :carId)
      or (c.outlet.id = :outletId and c.car is null)
      or (c.outlet is null and c.car is null)
  )

order by
  case
    when (c.outlet.id = :outletId and c.car.id = :carId) then 1
    when (c.outlet is null and c.car.id = :carId) then 2
    when (c.outlet.id = :outletId and c.car is null) then 3
    when (c.outlet is null and c.car is null) then 4
    else 99
  end,
  c.createdAt desc
""")
List<Coupon> findEligibleCouponsForBill(
        @Param("outletId") Long outletId,
        @Param("carId") Long carId,
        @Param("today") LocalDate today
);


}
