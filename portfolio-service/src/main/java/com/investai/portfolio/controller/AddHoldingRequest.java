package com.investai.portfolio.controller;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record AddHoldingRequest(
        @NotBlank String symbol,
        @DecimalMin("0.000001") BigDecimal quantity,
        @DecimalMin("0.000001") BigDecimal avgPrice
) {
}
