package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.Contribution;
import com.poolfolio.backend.entity.ContributionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {

    List<Contribution> findByMemberIdOrderByContributedAtDesc(Long memberId);

    List<Contribution> findByGroupIdOrderByContributedAtDesc(Long groupId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contribution c WHERE c.member.id = :memberId AND c.type = :type")
    BigDecimal sumAmountByMemberIdAndType(@Param("memberId") Long memberId, @Param("type") ContributionType type);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contribution c WHERE c.group.id = :groupId AND c.type = :type")
    BigDecimal sumAmountByGroupIdAndType(@Param("groupId") Long groupId, @Param("type") ContributionType type);
}
