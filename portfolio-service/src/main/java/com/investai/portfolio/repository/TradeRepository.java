package com.investai.portfolio.repository;

import com.investai.portfolio.model.Trade;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeRepository extends JpaRepository<Trade, UUID> {
}
