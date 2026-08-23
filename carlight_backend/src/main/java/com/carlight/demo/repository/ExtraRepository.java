package com.carlight.demo.repository;

import com.carlight.demo.entity.Extra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExtraRepository extends JpaRepository<Extra, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<Extra> findByActiveTrueOrderByNameAsc();

    List<Extra> findAllByOrderByNameAsc();

}
