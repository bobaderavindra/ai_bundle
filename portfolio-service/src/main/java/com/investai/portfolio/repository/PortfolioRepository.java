package com.investai.portfolio.repository;

import com.investai.portfolio.model.Portfolio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, String> {
    List<Portfolio> findByUserId(String userId);
}
