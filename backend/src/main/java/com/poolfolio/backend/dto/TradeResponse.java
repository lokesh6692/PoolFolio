package com.poolfolio.backend.dto;

import com.poolfolio.backend.entity.TradeType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TradeResponse(
        Long id,
        Long groupId,
        String symbol,
        TradeType tradeType,
        BigDecimal quantity,
        BigDecimal price,
        LocalDateTime tradedAt,
        String note
) {}