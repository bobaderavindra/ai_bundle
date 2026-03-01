package com.investai.portfolio.events;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TradeExecutedEvent(
        String tradeId,
        String userId,
        String portfolioId,
        String symbol,
        String tradeType,
        BigDecimal quantity,
        BigDecimal price,
        LocalDateTime tradeTime
) {
}
