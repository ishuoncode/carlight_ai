package com.carlight.demo.repository;

import com.carlight.demo.entity.WashPackage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WashPackageRepository extends JpaRepository<WashPackage, Long> {
    boolean existsByNameIgnoreCase(String name);
}
