package com.carlight.demo.repository;

import com.carlight.demo.entity.Car;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CarRepository extends JpaRepository<Car, Long> {
    Optional<Car> findByCarNo(String carNo);

    boolean existsByCarNo(String carNo);



        @Query("""
        SELECT c FROM Car c
        JOIN FETCH c.owner o
        WHERE c.deleted = false
        """)
        List<Car> findAllWithOwner();
    }


