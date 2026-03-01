package com.investai.portfolio.repository;

import com.investai.portfolio.model.Holding;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, String> {
    List<Holding> findByPortfolioId(String portfolioId);

    Optional<Holding> findByPortfolioIdAndSymbolIgnoreCase(String portfolioId, String symbol);
}
