package com.dev.paymentservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequest {

    @NotNull
    private String userId;

    @NotNull
    private Double amount;
}
