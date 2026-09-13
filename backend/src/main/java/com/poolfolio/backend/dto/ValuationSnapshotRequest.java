package com.poolfolio.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ValuationSnapshotRequest(
        @NotNull @DecimalMin(value = "0.00") BigDecimal totalValue,
        @NotNull LocalDateTime snapshotAt
) {}
