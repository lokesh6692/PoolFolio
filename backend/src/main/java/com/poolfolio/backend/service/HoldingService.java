package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.HoldingResponse;
import com.poolfolio.backend.entity.Holding;
import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.Trade;
import com.poolfolio.backend.entity.TradeType;
import com.poolfolio.backend.repository.HoldingRepository;
import com.poolfolio.backend.repository.InvestmentGroupRepository;
import com.poolfolio.backend.repository.TradeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final TradeRepository tradeRepository;
    private final InvestmentGroupRepository groupRepository;

    public HoldingService(HoldingRepository holdingRepository, TradeRepository tradeRepository, InvestmentGroupRepository groupRepository) {
        this.holdingRepository = holdingRepository;
        this.tradeRepository = tradeRepository;
        this.groupRepository = groupRepository;
    }

    @Transactional
    public void recomputeHolding(Long groupId, String symbol) {
        List<Trade> trades = tradeRepository.findByGroupIdAndSymbolOrderByTradedAtAsc(groupId, symbol);

        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (Trade trade : trades) {
            if (trade.getTradeType() == TradeType.BUY) {
                totalCost = totalCost.add(trade.getQuantity().multiply(trade.getPrice()));
                quantity = quantity.add(trade.getQuantity());
            } else {
                BigDecimal avgCost = quantity.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : totalCost.divide(quantity, 6, RoundingMode.HALF_UP);
                totalCost = totalCost.subtract(trade.getQuantity().multiply(avgCost));
                quantity = quantity.subtract(trade.getQuantity());
            }
        }

        BigDecimal averageCost = quantity.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : totalCost.divide(quantity, 4, RoundingMode.HALF_UP);

        Holding holding = holdingRepository.findByGroupIdAndSymbol(groupId, symbol)
                .orElseGet(() -> {
                    InvestmentGroup group = groupRepository.findById(groupId)
                            .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));
                    return Holding.builder().group(group).symbol(symbol).build();
                });

        holding.setQuantity(quantity);
        holding.setAverageCost(averageCost);
        holding.setUpdatedAt(LocalDateTime.now());
        holdingRepository.save(holding);
    }

    @Transactional(readOnly = true)
    public List<HoldingResponse> getGroupHoldings(Long groupId) {
        return holdingRepository.findByGroupIdOrderBySymbolAsc(groupId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HoldingResponse getHolding(Long groupId, String symbol) {
        Holding holding = holdingRepository.findByGroupIdAndSymbol(groupId, symbol)
                .orElseThrow(() -> new IllegalArgumentException("No holding found for symbol: " + symbol));
        return mapToResponse(holding);
    }

    private HoldingResponse mapToResponse(Holding h) {
        return new HoldingResponse(h.getId(), h.getGroup().getId(), h.getSymbol(), h.getQuantity(), h.getAverageCost(), h.getUpdatedAt());
    }
}