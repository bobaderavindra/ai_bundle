package com.investai.portfolio.model;

import java.math.BigDecimal;

public record Holding(String symbol, BigDecimal quantity, BigDecimal avgPrice) {
}
