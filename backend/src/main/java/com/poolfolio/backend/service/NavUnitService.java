package com.poolfolio.backend.service;

import com.poolfolio.backend.entity.Contribution;
import com.poolfolio.backend.entity.ContributionType;
import com.poolfolio.backend.entity.UnitLedger;
import com.poolfolio.backend.repository.UnitLedgerRepository;
import com.poolfolio.backend.repository.ValuationSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class NavUnitService {

    // Fixed seed NAV used only before any units exist or any valuation snapshot has been taken.
    // Purely a starting scale factor (like a mutual fund's par value) - does not affect ownership ratios.
    private static final BigDecimal SEED_NAV = new BigDecimal("100.00");

    private final UnitLedgerRepository unitLedgerRepository;
    private final ValuationSnapshotRepository valuationSnapshotRepository;

    public NavUnitService(UnitLedgerRepository unitLedgerRepository, ValuationSnapshotRepository valuationSnapshotRepository) {
        this.unitLedgerRepository = unitLedgerRepository;
        this.valuationSnapshotRepository = valuationSnapshotRepository;
    }

    /**
     * Current NAV per unit = most recent valuation snapshot's total value / total units outstanding.
     * NOTE: until Phase 6 (live prices), this reflects the last manually-triggered snapshot,
     * not a live mark-to-market value. This is a documented simplification (see plan Phase 6 caveat).
     */
    @Transactional(readOnly = true)
    public BigDecimal getCurrentNavPerUnit(Long groupId) {
        BigDecimal totalUnits = unitLedgerRepository.sumUnitsByGroupId(groupId);

        if (totalUnits.compareTo(BigDecimal.ZERO) <= 0) {
            return SEED_NAV;
        }

        return valuationSnapshotRepository.findTopByGroupIdOrderBySnapshotAtDesc(groupId)
                .map(v -> v.getTotalValue().divide(totalUnits, 6, RoundingMode.HALF_UP))
                .orElse(SEED_NAV);
    }

    /**
     * Issues (DEPOSIT) or redeems (WITHDRAWAL) units for a contribution, at the current NAV per unit.
     * Call this AFTER the contribution itself has been persisted.
     */
    @Transactional
    public void recordContributionUnits(Contribution contribution) {
        BigDecimal navPerUnit = getCurrentNavPerUnit(contribution.getGroup().getId());
        BigDecimal units = contribution.getAmount().divide(navPerUnit, 6, RoundingMode.HALF_UP);

        if (contribution.getType() == ContributionType.WITHDRAWAL) {
            units = units.negate();
        }

        UnitLedger entry = UnitLedger.builder()
                .group(contribution.getGroup())
                .member(contribution.getMember())
                .contribution(contribution)
                .units(units)
                .navPerUnit(navPerUnit)
                .transactionAt(contribution.getContributedAt())
                .build();

        unitLedgerRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalUnitsOutstanding(Long groupId) {
        return unitLedgerRepository.sumUnitsByGroupId(groupId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalUnitsOutstandingAsOf(Long groupId, LocalDateTime asOf) {
        return unitLedgerRepository.sumUnitsByGroupIdAsOf(groupId, asOf);
    }

    @Transactional(readOnly = true)
    public BigDecimal getMemberUnits(Long memberId) {
        return unitLedgerRepository.sumUnitsByMemberId(memberId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getMemberUnitsAsOf(Long memberId, LocalDateTime asOf) {
        return unitLedgerRepository.sumUnitsByMemberIdAsOf(memberId, asOf);
    }
}