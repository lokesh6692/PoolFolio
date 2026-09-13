package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.TradeRequest;
import com.poolfolio.backend.dto.TradeResponse;
import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.Trade;
import com.poolfolio.backend.repository.InvestmentGroupRepository;
import com.poolfolio.backend.repository.TradeRepository;
import com.poolfolio.backend.security.AuthenticatedMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;
    private final InvestmentGroupRepository groupRepository;
    private final HoldingService holdingService;

    public TradeService(TradeRepository tradeRepository, InvestmentGroupRepository groupRepository, HoldingService holdingService) {
        this.tradeRepository = tradeRepository;
        this.groupRepository = groupRepository;
        this.holdingService = holdingService;
    }

    @Transactional
    public TradeResponse create(AuthenticatedMember principal, TradeRequest request) {
        InvestmentGroup group = groupRepository.findById(principal.groupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + principal.groupId()));

        Trade trade = Trade.builder()
                .group(group)
                .symbol(request.symbol())
                .tradeType(request.tradeType())
                .quantity(request.quantity())
                .price(request.price())
                .tradedAt(request.tradedAt())
                .note(request.note())
                .build();

        Trade saved = tradeRepository.save(trade);
        holdingService.recomputeHolding(principal.groupId(), request.symbol());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TradeResponse> getGroupTrades(AuthenticatedMember principal) {
        return tradeRepository.findByGroupIdOrderByTradedAtDesc(principal.groupId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TradeResponse getTrade(AuthenticatedMember principal, Long tradeId) {
        return mapToResponse(getOwnedTrade(principal, tradeId));
    }

    @Transactional
    public TradeResponse update(AuthenticatedMember principal, Long tradeId, TradeRequest request) {
        Trade trade = getOwnedTrade(principal, tradeId);
        String oldSymbol = trade.getSymbol();

        trade.setSymbol(request.symbol());
        trade.setTradeType(request.tradeType());
        trade.setQuantity(request.quantity());
        trade.setPrice(request.price());
        trade.setTradedAt(request.tradedAt());
        trade.setNote(request.note());

        Trade saved = tradeRepository.save(trade);

        holdingService.recomputeHolding(principal.groupId(), oldSymbol);
        if (!oldSymbol.equals(request.symbol())) {
            holdingService.recomputeHolding(principal.groupId(), request.symbol());
        }

        return mapToResponse(saved);
    }

    @Transactional
    public void delete(AuthenticatedMember principal, Long tradeId) {
        Trade trade = getOwnedTrade(principal, tradeId);
        String symbol = trade.getSymbol();
        tradeRepository.delete(trade);
        holdingService.recomputeHolding(principal.groupId(), symbol);
    }

    private Trade getOwnedTrade(AuthenticatedMember principal, Long tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new IllegalArgumentException("Trade not found: " + tradeId));
        if (!trade.getGroup().getId().equals(principal.groupId())) {
            throw new IllegalArgumentException("Trade does not belong to your group");
        }
        return trade;
    }

    private TradeResponse mapToResponse(Trade t) {
        return new TradeResponse(t.getId(), t.getGroup().getId(), t.getSymbol(), t.getTradeType(), t.getQuantity(), t.getPrice(), t.getTradedAt(), t.getNote());
    }
}