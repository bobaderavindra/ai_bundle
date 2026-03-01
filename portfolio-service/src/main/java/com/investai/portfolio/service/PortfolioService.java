package com.investai.portfolio.service;

import com.investai.portfolio.model.Holding;
import com.investai.portfolio.model.Portfolio;
import com.investai.portfolio.repository.HoldingRepository;
import com.investai.portfolio.repository.PortfolioRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {
    private final PortfolioRepository repository;
    private final HoldingRepository holdingRepository;

    public PortfolioService(PortfolioRepository repository, HoldingRepository holdingRepository) {
        this.repository = repository;
        this.holdingRepository = holdingRepository;
    }

    @Transactional
    public Portfolio createPortfolio(String userId, String name) {
        return repository.save(new Portfolio(userId, name));
    }

    public List<Portfolio> listPortfolios(String userId) {
        return repository.findByUserId(userId);
    }

    @Transactional
    public Portfolio addHolding(String userId, String portfolioId, String symbol, BigDecimal quantity, BigDecimal avgPrice) {
        Portfolio portfolio = repository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied for portfolio");
        }
        Holding holding = new Holding(portfolio, symbol.toUpperCase(), quantity, avgPrice);
        holdingRepository.save(holding);
        return repository.findById(portfolioId).orElseThrow();
    }
}
