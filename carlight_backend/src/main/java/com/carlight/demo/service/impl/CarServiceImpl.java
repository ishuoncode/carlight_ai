package com.carlight.demo.service.impl;

import com.carlight.demo.dto.car.CarCreateRequest;
import com.carlight.demo.dto.car.CarLastVisitResponse;
import com.carlight.demo.dto.car.CarResponse;
import com.carlight.demo.entity.Car;
import com.carlight.demo.entity.Customer;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.BillRepository;
import com.carlight.demo.repository.CarRepository;
import com.carlight.demo.repository.CustomerRepository;
import com.carlight.demo.service.CarService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CarServiceImpl implements CarService {

    private final BillRepository billRepository;
    private final CarRepository carRepository;
    private final CustomerRepository customerRepository;








    @Override
    public CarResponse findByCarNo(String carNo) {

        String normalized = carNo.trim().toUpperCase();

        Car car = carRepository.findByCarNo(normalized)
                .orElseThrow(() -> new BadRequestException("Car not found: " + normalized));

        return CarResponse.builder()
                .id(car.getId())
                .carNo(car.getCarNo())
                .carType(car.getCarType())
                .active(car.getActive())
                .customerId(car.getOwner().getId())
                .customerName(car.getOwner().getName())
                .customerPhone(car.getOwner().getPhoneNumber())
                .build();
    }

    @Override
    @Transactional
    public CarResponse addCar(CarCreateRequest request) {

        String carNo = request.getCarNo().trim().toUpperCase();

        if (carRepository.existsByCarNo(carNo)) {
            throw new BadRequestException("Car already exists: " + carNo);
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new BadRequestException("Customer not found: " + request.getCustomerId()));

        Car car = Car.builder()
                .carNo(carNo)
                .carType(request.getCarType())
                .model(request.getModel() != null ? request.getModel().trim() : null)
                .owner(customer)
                .active(true)
                .deleted(false)
                .build();

        Car saved = carRepository.save(car);

        return toResponse(saved);
    }

    private CarResponse toResponse(Car car) {
        return CarResponse.builder()
                .id(car.getId())
                .carNo(car.getCarNo())
                .carType(car.getCarType())
                .model(car.getModel())
                .active(car.getActive())
                .deleted(car.getDeleted())
                .createdAt(car.getCreatedAt())
                .customerId(car.getOwner().getId())
                .customerName(car.getOwner().getName())
                .customerPhone(car.getOwner().getPhoneNumber())
                .build();
    }

    public List<CarResponse> getAllCarsWithOwner() {

        return carRepository.findAllWithOwner()
                .stream()
                .map(car -> CarResponse.builder()
                        .id(car.getId())
                        .carNo(car.getCarNo())
                        .carType(car.getCarType())
                        .model(car.getModel())
                        .active(car.getActive())
                        .deleted(car.getDeleted())
                        .createdAt(car.getCreatedAt())

                        .customerId(car.getOwner().getId())
                        .customerName(car.getOwner().getName())
                        .customerPhone(car.getOwner().getPhoneNumber())
                        .build())
                .toList();
    }



}
