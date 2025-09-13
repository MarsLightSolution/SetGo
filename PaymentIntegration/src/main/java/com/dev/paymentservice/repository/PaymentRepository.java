package com.dev.paymentservice.repository;

import com.aditya.paymentservice.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PaymentRepository extends MongoRepository<Payment, String> {
}
