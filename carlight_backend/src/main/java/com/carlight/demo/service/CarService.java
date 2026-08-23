package com.carlight.demo.service;

import com.carlight.demo.dto.car.CarCreateRequest;
import com.carlight.demo.dto.car.CarLastVisitResponse;
import com.carlight.demo.dto.car.CarResponse;

import java.util.List;

public interface CarService {

    List<CarResponse> getAllCarsWithOwner();

    CarResponse findByCarNo(String carNo);

    CarResponse addCar(CarCreateRequest request);

}


