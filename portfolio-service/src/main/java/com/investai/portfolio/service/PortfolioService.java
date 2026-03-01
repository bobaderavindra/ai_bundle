package com.investai.portfolio.service;

import com.investai.portfolio.model.Holding;
import com.investai.portfolio.model.Portfolio;
import com.investai.portfolio.repository.PortfolioRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PortfolioService {
    private final PortfolioRepository repository;

    public PortfolioService(PortfolioRepository repository) {
        this.repository = repository;
    }

    public Portfolio createPortfolio(String ownerEmail, String name) {
        return repository.save(new Portfolio(ownerEmail, name));
    }

    public List<Portfolio> listPortfolios(String ownerEmail) {
        return repository.findByOwnerEmail(ownerEmail);
    }

    public Portfolio addHolding(String ownerEmail, String portfolioId, String symbol, BigDecimal quantity, BigDecimal avgPrice) {
        Portfolio portfolio = repository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        if (!portfolio.getOwnerEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Access denied for portfolio");
        }
        portfolio.getHoldings().add(new Holding(symbol.toUpperCase(), quantity, avgPrice));
        return portfolio;
    }
}
