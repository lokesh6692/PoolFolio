package com.poolfolio.backend.dto;

import com.poolfolio.backend.entity.ContributionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContributionRequest(
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull ContributionType type,
        String note,
        @NotNull LocalDateTime contributedAt
) {}
