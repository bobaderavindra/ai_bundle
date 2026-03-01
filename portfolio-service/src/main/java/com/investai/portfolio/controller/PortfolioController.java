package com.investai.portfolio.controller;

import com.investai.portfolio.model.Portfolio;
import com.investai.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {
    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @PostMapping
    public ResponseEntity<Portfolio> createPortfolio(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreatePortfolioRequest request
    ) {
        return ResponseEntity.ok(portfolioService.createPortfolio(userId, request.name()));
    }

    @GetMapping
    public ResponseEntity<List<Portfolio>> listPortfolios(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(portfolioService.listPortfolios(userId));
    }

    @PostMapping("/{portfolioId}/holding")
    public ResponseEntity<Portfolio> addHolding(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String portfolioId,
            @Valid @RequestBody AddHoldingRequest request
    ) {
        return ResponseEntity.ok(
                portfolioService.addHolding(userId, portfolioId, request.symbol(), request.quantity(), request.avgPrice())
        );
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handle(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
