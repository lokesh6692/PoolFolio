package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.InvestmentGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvestmentGroupRepository extends JpaRepository<InvestmentGroup, Long> {
    Optional<InvestmentGroup> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
