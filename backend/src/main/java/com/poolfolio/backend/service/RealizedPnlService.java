package com.poolfolio.backend.service;

import com.poolfolio.backend.entity.Trade;
import com.poolfolio.backend.entity.TradeType;
import com.poolfolio.backend.repository.TradeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Computes realized profit/loss on group SELL trades and allocates it to members
 * by their unit-share of total units outstanding at the moment each sell happened
 * (per plan section 3.4 - allocation uses ownership at time of the trade, not at
 * time of original purchase).
 *
 * Replays trade history per symbol using the same weighted-average-cost logic as
 * HoldingService.recomputeHolding, but records a realized event for every SELL
 * along the way instead of only keeping the final holding state.
 */
@Service
public class RealizedPnlService {

    public record RealizedPnlEvent(String symbol, LocalDateTime tradedAt, BigDecimal amount) {}

    private final TradeRepository tradeRepository;
    private final NavUnitService navUnitService;

    public RealizedPnlService(TradeRepository tradeRepository, NavUnitService navUnitService) {
        this.tradeRepository = tradeRepository;
        this.navUnitService = navUnitService;
    }

    @Transactional(readOnly = true)
    public List<RealizedPnlEvent> computeRealizedEvents(Long groupId) {
        List<Trade> trades = tradeRepository.findByGroupIdOrderByTradedAtAsc(groupId);

        Map<String, BigDecimal> quantityBySymbol = new LinkedHashMap<>();
        Map<String, BigDecimal> totalCostBySymbol = new LinkedHashMap<>();
        List<RealizedPnlEvent> events = new ArrayList<>();

        for (Trade trade : trades) {
            String symbol = trade.getSymbol();
            BigDecimal quantity = quantityBySymbol.getOrDefault(symbol, BigDecimal.ZERO);
            BigDecimal totalCost = totalCostBySymbol.getOrDefault(symbol, BigDecimal.ZERO);

            if (trade.getTradeType() == TradeType.BUY) {
                totalCost = totalCost.add(trade.getQuantity().multiply(trade.getPrice()));
                quantity = quantity.add(trade.getQuantity());
            } else {
                BigDecimal avgCost = quantity.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : totalCost.divide(quantity, 6, RoundingMode.HALF_UP);

                BigDecimal realized = trade.getQuantity().multiply(trade.getPrice().subtract(avgCost));
                events.add(new RealizedPnlEvent(symbol, trade.getTradedAt(), realized));

                totalCost = totalCost.subtract(trade.getQuantity().multiply(avgCost));
                quantity = quantity.subtract(trade.getQuantity());
            }

            quantityBySymbol.put(symbol, quantity);
            totalCostBySymbol.put(symbol, totalCost);
        }

        return events;
    }

    @Transactional(readOnly = true)
    public BigDecimal getGroupRealizedPnlAsOf(Long groupId, LocalDateTime asOf) {
        return computeRealizedEvents(groupId).stream()
                .filter(e -> !e.tradedAt().isAfter(asOf))
                .map(RealizedPnlEvent::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public BigDecimal getMemberRealizedPnlAsOf(Long groupId, Long memberId, LocalDateTime asOf) {
        BigDecimal total = BigDecimal.ZERO;

        for (RealizedPnlEvent event : computeRealizedEvents(groupId)) {
            if (event.tradedAt().isAfter(asOf)) {
                continue;
            }

            BigDecimal totalUnitsAtTrade = navUnitService.getTotalUnitsOutstandingAsOf(groupId, event.tradedAt());
            if (totalUnitsAtTrade.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal memberUnitsAtTrade = navUnitService.getMemberUnitsAsOf(memberId, event.tradedAt());
            BigDecimal share = memberUnitsAtTrade.divide(totalUnitsAtTrade, 10, RoundingMode.HALF_UP);
            total = total.add(event.amount().multiply(share));
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }
}
