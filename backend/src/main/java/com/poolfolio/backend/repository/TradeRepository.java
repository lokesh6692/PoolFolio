package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.Trade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findByGroupIdOrderByTradedAtDesc(Long groupId);
    List<Trade> findByGroupIdAndSymbolOrderByTradedAtAsc(Long groupId, String symbol);
}