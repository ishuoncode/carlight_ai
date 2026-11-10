package com.carlight.demo.repository;

import com.carlight.demo.entity.CarType;
import com.carlight.demo.entity.OutletPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OutletPackageRepository extends JpaRepository<OutletPackage, Long> {

    Optional<OutletPackage> findByOutlet_IdAndWashPackage_IdAndCarType(
            Long outletId,
            Long washPackageId,
            CarType carType
    );
    List<OutletPackage> findByOutlet_IdAndActiveTrueOrderByWashPackage_NameAscCarTypeAsc(Long outletId);

    Optional<OutletPackage> findByOutlet_IdAndWashPackage_IdAndCarTypeAndActiveTrue(
            Long outletId,
            Long washPackageId,
            CarType carType
    );

    List<OutletPackage> findByOutlet_IdOrderByWashPackage_NameAscCarTypeAsc(Long outletId);

    // ✅ find manual/free package for fast billing
    Optional<OutletPackage> findByOutlet_IdAndWashPackage_NameAndCarType(
            Long outletId,
            String washPackageName,
            CarType carType
    );
}
