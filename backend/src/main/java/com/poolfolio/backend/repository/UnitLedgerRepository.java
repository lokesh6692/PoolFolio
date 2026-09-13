package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.UnitLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface UnitLedgerRepository extends JpaRepository<UnitLedger, Long> {

    @Query("SELECT COALESCE(SUM(u.units), 0) FROM UnitLedger u WHERE u.group.id = :groupId")
    BigDecimal sumUnitsByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT COALESCE(SUM(u.units), 0) FROM UnitLedger u WHERE u.group.id = :groupId AND u.transactionAt <= :asOf")
    BigDecimal sumUnitsByGroupIdAsOf(@Param("groupId") Long groupId, @Param("asOf") LocalDateTime asOf);

    @Query("SELECT COALESCE(SUM(u.units), 0) FROM UnitLedger u WHERE u.member.id = :memberId")
    BigDecimal sumUnitsByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COALESCE(SUM(u.units), 0) FROM UnitLedger u WHERE u.member.id = :memberId AND u.transactionAt <= :asOf")
    BigDecimal sumUnitsByMemberIdAsOf(@Param("memberId") Long memberId, @Param("asOf") LocalDateTime asOf);
}