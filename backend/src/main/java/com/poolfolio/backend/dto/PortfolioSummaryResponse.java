package com.poolfolio.backend.dto;

import java.math.BigDecimal;

public record PortfolioSummaryResponse(
        Long groupId,
        BigDecimal totalContributed,
        BigDecimal stockHoldingsValue,
        BigDecimal ipoHoldingsValue,
        BigDecimal availableCash
) {}