package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.ProfitShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfitShareRepository extends JpaRepository<ProfitShare, Long> {
    List<ProfitShare> findByValuationIdOrderByMemberIdAsc(Long valuationId);
}
