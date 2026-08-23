package com.carlight.demo.repository;

import com.carlight.demo.entity.CarType;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.OutletPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OutletRepository extends JpaRepository<Outlet, Long> {


}
