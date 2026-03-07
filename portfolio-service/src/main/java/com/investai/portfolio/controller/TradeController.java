package com.investai.portfolio.controller;

import com.investai.portfolio.events.TradeEventConsumer;
import com.investai.portfolio.model.Trade;
import com.investai.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TradeController {
    private final PortfolioService portfolioService;
    private final TradeEventConsumer tradeEventConsumer;

    public TradeController(PortfolioService portfolioService, TradeEventConsumer tradeEventConsumer) {
        this.portfolioService = portfolioService;
        this.tradeEventConsumer = tradeEventConsumer;
    }

    @PostMapping("/trade")
    public ResponseEntity<Trade> createTrade(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateTradeRequest request
    ) {
        return ResponseEntity.ok(
                portfolioService.executeTrade(
                        userId,
                        request.portfolioId(),
                        request.symbol(),
                        request.tradeType(),
                        request.quantity(),
                        request.price()
                )
        );
    }

    @GetMapping("/allocation")
    public ResponseEntity<Map<String, Object>> allocation(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam String portfolioId
    ) {
        return ResponseEntity.ok(portfolioService.calculateAllocation(userId, portfolioId));
    }

    @GetMapping("/trade/events/recent")
    public ResponseEntity<Map<String, List<?>>> recentEvents(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(Map.of("events", tradeEventConsumer.getRecentEvents()));
    }
}
