package com.dev.paymentservice.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    private String id;

    private String userId;
    private Double amount;
    private String status;          // PENDING, SUCCESS, FAILED
    private String transactionId;   // from 3rd party gateway
    private Instant createdAt;
    private Instant updatedAt;
}
