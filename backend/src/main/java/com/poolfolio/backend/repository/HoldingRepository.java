package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
    List<Holding> findByGroupIdOrderBySymbolAsc(Long groupId);
    Optional<Holding> findByGroupIdAndSymbol(Long groupId, String symbol);
}