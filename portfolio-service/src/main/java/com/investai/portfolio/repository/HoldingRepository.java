package com.investai.portfolio.repository;

import com.investai.portfolio.model.Holding;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, UUID> {
    List<Holding> findByPortfolioId(UUID portfolioId);

    Optional<Holding> findByPortfolioIdAndSymbolIgnoreCase(UUID portfolioId, String symbol);
}
