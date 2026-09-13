package com.poolfolio.backend.service;

import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.Trade;
import com.poolfolio.backend.entity.TradeType;
import com.poolfolio.backend.repository.TradeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RealizedPnlServiceTest {

    @Mock
    private TradeRepository tradeRepository;
    @Mock
    private NavUnitService navUnitService;

    @InjectMocks
    private RealizedPnlService realizedPnlService;

    private InvestmentGroup group;

    @BeforeEach
    void setUp() {
        group = InvestmentGroup.builder().id(1L).build();
    }

    private Trade trade(String symbol, TradeType type, String qty, String price, LocalDateTime tradedAt) {
        return Trade.builder()
                .group(group)
                .symbol(symbol)
                .tradeType(type)
                .quantity(new BigDecimal(qty))
                .price(new BigDecimal(price))
                .tradedAt(tradedAt)
                .build();
    }

    @Test
    void computeRealizedEvents_singleBuyThenFullSell_realizesFullGain() {
        LocalDateTime buyAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime sellAt = LocalDateTime.of(2026, 3, 1, 0, 0);

        when(tradeRepository.findByGroupIdOrderByTradedAtAsc(1L)).thenReturn(List.of(
                trade("ACME", TradeType.BUY, "10", "100", buyAt),
                trade("ACME", TradeType.SELL, "10", "130", sellAt)
        ));

        List<RealizedPnlService.RealizedPnlEvent> events = realizedPnlService.computeRealizedEvents(1L);

        assertThat(events).hasSize(1);
        assertThat(events.get(0).amount()).isEqualByComparingTo("300");
        assertThat(events.get(0).tradedAt()).isEqualTo(sellAt);
    }

    @Test
    void computeRealizedEvents_partialSell_usesWeightedAverageCost() {
        LocalDateTime t1 = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 1, 15, 0, 0);
        LocalDateTime t3 = LocalDateTime.of(2026, 2, 1, 0, 0);

        when(tradeRepository.findByGroupIdOrderByTradedAtAsc(1L)).thenReturn(List.of(
                trade("ACME", TradeType.BUY, "10", "100", t1),
                trade("ACME", TradeType.BUY, "10", "120", t2),
                trade("ACME", TradeType.SELL, "5", "150", t3)
        ));

        List<RealizedPnlService.RealizedPnlEvent> events = realizedPnlService.computeRealizedEvents(1L);

        assertThat(events).hasSize(1);
        assertThat(events.get(0).amount()).isEqualByComparingTo("200.00");
    }

    @Test
    void getMemberRealizedPnlAsOf_allocatesByUnitShareAtTimeOfTrade_notAtTimeOfPurchase() {
        LocalDateTime sellAt = LocalDateTime.of(2026, 3, 1, 0, 0);

        when(tradeRepository.findByGroupIdOrderByTradedAtAsc(1L)).thenReturn(List.of(
                trade("ACME", TradeType.BUY, "10", "100", LocalDateTime.of(2026, 1, 15, 0, 0)),
                trade("ACME", TradeType.SELL, "10", "160", sellAt)
        ));
        when(navUnitService.getTotalUnitsOutstandingAsOf(1L, sellAt)).thenReturn(new BigDecimal("300"));
        when(navUnitService.getMemberUnitsAsOf(42L, sellAt)).thenReturn(new BigDecimal("100"));

        BigDecimal memberShare = realizedPnlService.getMemberRealizedPnlAsOf(1L, 42L, sellAt);

        assertThat(memberShare).isEqualByComparingTo("200.00");
    }

    @Test
    void getMemberRealizedPnlAsOf_excludesEventsAfterAsOfCutoff() {
        LocalDateTime earlySell = LocalDateTime.of(2026, 2, 1, 0, 0);
        LocalDateTime lateSell = LocalDateTime.of(2026, 4, 1, 0, 0);
        LocalDateTime cutoff = LocalDateTime.of(2026, 3, 1, 0, 0);

        when(tradeRepository.findByGroupIdOrderByTradedAtAsc(1L)).thenReturn(List.of(
                trade("ACME", TradeType.BUY, "10", "100", LocalDateTime.of(2026, 1, 1, 0, 0)),
                trade("ACME", TradeType.SELL, "5", "150", earlySell),
                trade("ACME", TradeType.BUY, "5", "100", LocalDateTime.of(2026, 2, 15, 0, 0)),
                trade("ACME", TradeType.SELL, "5", "150", lateSell)
        ));
        when(navUnitService.getTotalUnitsOutstandingAsOf(1L, earlySell)).thenReturn(new BigDecimal("100"));
        when(navUnitService.getMemberUnitsAsOf(42L, earlySell)).thenReturn(new BigDecimal("100"));

        BigDecimal result = realizedPnlService.getMemberRealizedPnlAsOf(1L, 42L, cutoff);

        assertThat(result).isEqualByComparingTo("250.00");
    }

    @Test
    void getMemberRealizedPnlAsOf_returnsZero_whenNoUnitsOutstandingAtTradeTime() {
        LocalDateTime sellAt = LocalDateTime.of(2026, 3, 1, 0, 0);

        when(tradeRepository.findByGroupIdOrderByTradedAtAsc(1L)).thenReturn(List.of(
                trade("ACME", TradeType.BUY, "10", "100", LocalDateTime.of(2026, 1, 1, 0, 0)),
                trade("ACME", TradeType.SELL, "10", "150", sellAt)
        ));
        when(navUnitService.getTotalUnitsOutstandingAsOf(1L, sellAt)).thenReturn(BigDecimal.ZERO);

        BigDecimal result = realizedPnlService.getMemberRealizedPnlAsOf(1L, 42L, sellAt);

        assertThat(result).isEqualByComparingTo("0.00");
    }
}
