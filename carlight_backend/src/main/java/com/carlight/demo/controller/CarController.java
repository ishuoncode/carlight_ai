package com.carlight.demo.controller;

import com.carlight.demo.dto.car.CarCreateRequest;
import com.carlight.demo.dto.car.CarLastVisitResponse;
import com.carlight.demo.dto.car.CarResponse;
import com.carlight.demo.service.CarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

//    //  full list
//    // /api/cars/last-visit
//    // /api/cars/last-visit?outletId=1
//    @GetMapping("/last-visit")
//    public List<CarLastVisitResponse> lastVisit(
//            @RequestParam(required = false) Long outletId
//    ) {
//        return carService.carsLastVisit(outletId);
//    }
//
//    // inactive cars
//    // /api/cars/inactive?days=30
//    // /api/cars/inactive?days=30&outletId=1
//    @GetMapping("/inactive")
//    public List<CarLastVisitResponse> inactive(
//            @RequestParam int days,
//            @RequestParam(required = false) Long outletId
//    ) {
//        return carService.inactiveCars(outletId, days);
//    }
//
//    @DeleteMapping("/{carId}")
//    @PreAuthorize("hasRole('ADMIN')")
//    public void deleteCar(@PathVariable Long carId) {
//        carService.deleteCar(carId);
//    }


    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public CarResponse findCar(@RequestParam String carNo) {
        return carService.findByCarNo(carNo);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public CarResponse addCar(@RequestBody @Valid CarCreateRequest request) {
        return carService.addCar(request);
    }


    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<CarResponse> getAllCarsWithOwner() {
        return carService.getAllCarsWithOwner();
    }




}
