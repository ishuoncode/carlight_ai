package com.carlight.demo.controller.admin;

import com.carlight.demo.dto.car.UpdateCarRequest;
import com.carlight.demo.dto.customer.UpdateCarOwnerRequest;
import com.carlight.demo.dto.customer.UpdateCustomerRequest;
import com.carlight.demo.entity.Car;
import com.carlight.demo.entity.Customer;
import com.carlight.demo.repository.CarRepository;
import com.carlight.demo.repository.CustomerRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {

    private final CustomerRepository customerRepository;
    private final CarRepository carRepository;

    //  Update customer (name + phone)
    @PutMapping("/customers/{customerId}")
    public Customer updateCustomer(
            @PathVariable Long customerId,
            @RequestBody @Valid UpdateCustomerRequest request
    ) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        String newPhone = request.getPhoneNumber().trim();

        // check unique phone
        if (!customer.getPhoneNumber().equals(newPhone) &&
                customerRepository.existsByPhoneNumber(newPhone)) {
            throw new RuntimeException("Phone number already exists");
        }

        customer.setName(request.getName().trim());
        customer.setPhoneNumber(newPhone);

        return customerRepository.save(customer);
    }

    //  Update car (vehicle number + type + model)
    @PutMapping("/cars/{carId}")
    public Car updateCar(
            @PathVariable Long carId,
            @RequestBody @Valid UpdateCarRequest request
    ) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new RuntimeException("Car not found"));

        String newCarNo = request.getCarNo().trim().toUpperCase();

        // check unique carNo
        if (!car.getCarNo().equals(newCarNo) && carRepository.existsByCarNo(newCarNo)) {
            throw new RuntimeException("Vehicle number already exists");
        }

        car.setCarNo(newCarNo);

        if (request.getCarType() != null) {
            car.setCarType(request.getCarType());
        }
        if (request.getModel() != null) {
            car.setModel(request.getModel().trim());
        }

        return carRepository.save(car);
    }

    // ✅ Staff (CASHIER) may also fix wrong owner/car details entered during billing —
    // duplicates (phone / vehicle no) are validated below before saving.
    @PutMapping("/cars/{carId}/owner")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public Car updateCarAndOwner(
            @PathVariable Long carId,
            @RequestBody @Valid UpdateCarOwnerRequest request
    ) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new RuntimeException("Car not found"));

        Customer customer = car.getOwner();

        // ✅ update car no
        String newCarNo = request.getCarNo().trim().toUpperCase();
        if (!car.getCarNo().equals(newCarNo) && carRepository.existsByCarNo(newCarNo)) {
            throw new RuntimeException("Vehicle number already exists");
        }
        car.setCarNo(newCarNo);

        if (request.getCarModel() != null && !request.getCarModel().trim().isEmpty()) {
            car.setModel(request.getCarModel().trim());
        }

        // ✅ update customer phone
        String newPhone = request.getCustomerPhone().trim();
        if (!customer.getPhoneNumber().equals(newPhone) &&
                customerRepository.existsByPhoneNumber(newPhone)) {
            throw new RuntimeException("Phone number already exists");
        }

        customer.setName(request.getCustomerName().trim());
        customer.setPhoneNumber(newPhone);

        customerRepository.save(customer);
        return carRepository.save(car);
    }

}
