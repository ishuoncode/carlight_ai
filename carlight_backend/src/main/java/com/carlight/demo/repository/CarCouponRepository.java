package com.carlight.demo.repository;

import com.carlight.demo.entity.CarCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarCouponRepository extends JpaRepository<CarCoupon, Long> {

    boolean existsByCoupon_IdAndCar_Id(Long couponId, Long carId);
}

