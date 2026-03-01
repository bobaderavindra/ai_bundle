package com.investai.portfolio.controller;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CreateTradeRequest(
        @NotBlank String portfolioId,
        @NotBlank String symbol,
        @NotBlank String tradeType,
        @DecimalMin("0.000001") BigDecimal quantity,
        @DecimalMin("0.000001") BigDecimal price
) {
}
