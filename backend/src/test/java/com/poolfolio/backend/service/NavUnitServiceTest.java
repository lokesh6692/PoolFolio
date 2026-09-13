package com.poolfolio.backend.service;

import com.poolfolio.backend.entity.Contribution;
import com.poolfolio.backend.entity.ContributionType;
import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.Member;
import com.poolfolio.backend.entity.UnitLedger;
import com.poolfolio.backend.entity.ValuationSnapshot;
import com.poolfolio.backend.repository.UnitLedgerRepository;
import com.poolfolio.backend.repository.ValuationSnapshotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NavUnitServiceTest {

    @Mock
    private UnitLedgerRepository unitLedgerRepository;
    @Mock
    private ValuationSnapshotRepository valuationSnapshotRepository;

    @InjectMocks
    private NavUnitService navUnitService;

    @Test
    void getCurrentNavPerUnit_fallsBackToSeedNav_whenNoUnitsOutstanding() {
        when(unitLedgerRepository.sumUnitsByGroupId(1L)).thenReturn(BigDecimal.ZERO);

        BigDecimal nav = navUnitService.getCurrentNavPerUnit(1L);

        assertThat(nav).isEqualByComparingTo("100.00");
        verifyNoInteractions(valuationSnapshotRepository);
    }

    @Test
    void getCurrentNavPerUnit_usesLatestSnapshot_whenUnitsExist() {
        when(unitLedgerRepository.sumUnitsByGroupId(1L)).thenReturn(new BigDecimal("50"));
        when(valuationSnapshotRepository.findTopByGroupIdOrderBySnapshotAtDesc(1L))
                .thenReturn(Optional.of(ValuationSnapshot.builder().totalValue(new BigDecimal("6000")).build()));

        BigDecimal nav = navUnitService.getCurrentNavPerUnit(1L);

        assertThat(nav).isEqualByComparingTo("120");
    }

    @Test
    void recordContributionUnits_withdrawal_recordsNegativeUnits() {
        InvestmentGroup group = InvestmentGroup.builder().id(1L).build();
        Member member = Member.builder().id(7L).group(group).build();
        Contribution withdrawal = Contribution.builder()
                .id(99L)
                .group(group)
                .member(member)
                .amount(new BigDecimal("500"))
                .type(ContributionType.WITHDRAWAL)
                .contributedAt(LocalDateTime.of(2026, 2, 1, 0, 0))
                .build();

        when(unitLedgerRepository.sumUnitsByGroupId(1L)).thenReturn(new BigDecimal("100"));
        when(valuationSnapshotRepository.findTopByGroupIdOrderBySnapshotAtDesc(1L))
                .thenReturn(Optional.of(ValuationSnapshot.builder().totalValue(new BigDecimal("10000")).build()));

        navUnitService.recordContributionUnits(withdrawal);

        ArgumentCaptor<UnitLedger> captor = ArgumentCaptor.forClass(UnitLedger.class);
        verify(unitLedgerRepository).save(captor.capture());
        assertThat(captor.getValue().getUnits()).isEqualByComparingTo("-5");
        assertThat(captor.getValue().getNavPerUnit()).isEqualByComparingTo("100");
    }

    @Test
    void recordContributionUnits_lateJoiningMember_getsFewerUnitsForSameAmount_whenNavHasGrown() {
        InvestmentGroup group = InvestmentGroup.builder().id(1L).build();
        Member earlyMember = Member.builder().id(1L).group(group).build();
        Member lateMember = Member.builder().id(2L).group(group).build();

        when(unitLedgerRepository.sumUnitsByGroupId(1L)).thenReturn(BigDecimal.ZERO);
        Contribution early = Contribution.builder()
                .group(group).member(earlyMember)
                .amount(new BigDecimal("1000"))
                .type(ContributionType.DEPOSIT)
                .contributedAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
        navUnitService.recordContributionUnits(early);

        when(unitLedgerRepository.sumUnitsByGroupId(1L)).thenReturn(new BigDecimal("10"));
        when(valuationSnapshotRepository.findTopByGroupIdOrderBySnapshotAtDesc(1L))
                .thenReturn(Optional.of(ValuationSnapshot.builder().totalValue(new BigDecimal("2000")).build()));
        Contribution late = Contribution.builder()
                .group(group).member(lateMember)
                .amount(new BigDecimal("1000"))
                .type(ContributionType.DEPOSIT)
                .contributedAt(LocalDateTime.of(2026, 2, 1, 0, 0))
                .build();

        navUnitService.recordContributionUnits(late);

        ArgumentCaptor<UnitLedger> captor = ArgumentCaptor.forClass(UnitLedger.class);
        verify(unitLedgerRepository, times(2)).save(captor.capture());
        UnitLedger lateEntry = captor.getAllValues().get(1);
        assertThat(lateEntry.getUnits()).isEqualByComparingTo("5");
    }
}
