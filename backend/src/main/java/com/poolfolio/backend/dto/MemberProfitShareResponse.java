package com.poolfolio.backend.dto;

import java.math.BigDecimal;

public record MemberProfitShareResponse(
        Long memberId,
        String memberDisplayName,
        BigDecimal unitsHeld,
        BigDecimal unitSharePercentage,
        BigDecimal totalContributed,
        BigDecimal totalInvested,
        BigDecimal availableCashWithoutPl,
        BigDecimal realizedProfitLoss,
        BigDecimal availableCashWithPl,
        BigDecimal currentValue,
        BigDecimal profitLoss
) {}
