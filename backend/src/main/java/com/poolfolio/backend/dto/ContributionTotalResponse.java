package com.poolfolio.backend.dto;

import java.math.BigDecimal;

public record ContributionTotalResponse(
        BigDecimal totalDeposits,
        BigDecimal totalWithdrawals,
        BigDecimal netTotal
) {}
