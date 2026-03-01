package com.investai.portfolio.service;

import com.investai.portfolio.events.TradeEventPublisher;
import com.investai.portfolio.events.TradeExecutedEvent;
import com.investai.portfolio.model.Holding;
import com.investai.portfolio.model.Portfolio;
import com.investai.portfolio.model.Trade;
import com.investai.portfolio.repository.HoldingRepository;
import com.investai.portfolio.repository.PortfolioRepository;
import com.investai.portfolio.repository.TradeRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {
    private final PortfolioRepository repository;
    private final HoldingRepository holdingRepository;
    private final TradeRepository tradeRepository;
    private final TradeEventPublisher tradeEventPublisher;

    public PortfolioService(
            PortfolioRepository repository,
            HoldingRepository holdingRepository,
            TradeRepository tradeRepository,
            TradeEventPublisher tradeEventPublisher
    ) {
        this.repository = repository;
        this.holdingRepository = holdingRepository;
        this.tradeRepository = tradeRepository;
        this.tradeEventPublisher = tradeEventPublisher;
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

    @Transactional
    public Trade executeTrade(String userId, String portfolioId, String symbol, String tradeType, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = repository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied for portfolio");
        }

        String normalizedType = tradeType.toUpperCase();
        if (!normalizedType.equals("BUY") && !normalizedType.equals("SELL")) {
            throw new IllegalArgumentException("tradeType must be BUY or SELL");
        }

        String normalizedSymbol = symbol.toUpperCase();
        Holding holding = holdingRepository.findByPortfolioIdAndSymbolIgnoreCase(portfolioId, normalizedSymbol)
                .orElse(null);

        if (normalizedType.equals("BUY")) {
            if (holding == null) {
                holdingRepository.save(new Holding(portfolio, normalizedSymbol, quantity, price));
            } else {
                BigDecimal oldValue = holding.getQuantity().multiply(holding.getAvgPrice());
                BigDecimal newValue = quantity.multiply(price);
                BigDecimal totalQuantity = holding.getQuantity().add(quantity);
                BigDecimal weightedAvg = oldValue.add(newValue).divide(totalQuantity, 6, RoundingMode.HALF_UP);
                holding.setQuantity(totalQuantity);
                holding.setAvgPrice(weightedAvg);
                holdingRepository.save(holding);
            }
        } else {
            if (holding == null || holding.getQuantity().compareTo(quantity) < 0) {
                throw new IllegalArgumentException("Insufficient holdings for sell trade");
            }
            BigDecimal remaining = holding.getQuantity().subtract(quantity);
            if (remaining.compareTo(BigDecimal.ZERO) == 0) {
                holdingRepository.delete(holding);
            } else {
                holding.setQuantity(remaining);
                holdingRepository.save(holding);
            }
        }

        Trade trade = tradeRepository.save(new Trade(portfolio, normalizedSymbol, normalizedType, quantity, price));
        tradeEventPublisher.publish(new TradeExecutedEvent(
                trade.getId(),
                userId,
                portfolioId,
                trade.getSymbol(),
                trade.getTradeType(),
                trade.getQuantity(),
                trade.getPrice(),
                trade.getTradeTime()
        ));
        return trade;
    }

    public Map<String, Object> calculateAllocation(String userId, String portfolioId) {
        Portfolio portfolio = repository.findById(portfolioId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
        if (!portfolio.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied for portfolio");
        }

        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        BigDecimal totalValue = holdings.stream()
                .map(h -> h.getQuantity().multiply(h.getAvgPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("portfolioId", portfolioId);
        response.put("userId", userId);
        response.put("totalValue", totalValue);

        List<Map<String, Object>> allocation = holdings.stream()
                .map(h -> {
                    BigDecimal value = h.getQuantity().multiply(h.getAvgPrice());
                    BigDecimal weight = totalValue.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : value.divide(totalValue, 6, RoundingMode.HALF_UP);

                    Map<String, Object> item = new HashMap<>();
                    item.put("symbol", h.getSymbol());
                    item.put("quantity", h.getQuantity());
                    item.put("avgPrice", h.getAvgPrice());
                    item.put("value", value);
                    item.put("weight", weight);
                    return item;
                })
                .sorted(Comparator.comparing(m -> String.valueOf(m.get("symbol"))))
                .toList();

        response.put("allocation", allocation);
        return response;
    }
}
