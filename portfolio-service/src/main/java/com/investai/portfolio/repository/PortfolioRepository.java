package com.investai.portfolio.repository;

import com.investai.portfolio.model.Portfolio;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class PortfolioRepository {
    private final Map<String, Portfolio> store = new ConcurrentHashMap<>();

    public Portfolio save(Portfolio portfolio) {
        store.put(portfolio.getId(), portfolio);
        return portfolio;
    }

    public Optional<Portfolio> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Portfolio> findByOwnerEmail(String ownerEmail) {
        return store.values().stream()
                .filter(p -> p.getOwnerEmail().equalsIgnoreCase(ownerEmail))
                .collect(Collectors.toList());
    }
}
