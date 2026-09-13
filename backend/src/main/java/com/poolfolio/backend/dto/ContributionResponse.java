package com.poolfolio.backend.dto;

import com.poolfolio.backend.entity.ContributionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContributionResponse(
        Long id,
        Long memberId,
        String memberDisplayName,
        Long groupId,
        BigDecimal amount,
        ContributionType type,
        String note,
        LocalDateTime contributedAt
) {}
