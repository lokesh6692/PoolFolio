package com.poolfolio.backend.dto;

import com.poolfolio.backend.entity.TradeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TradeRequest(
        @NotBlank String symbol,
        @NotNull TradeType tradeType,
        @NotNull @DecimalMin(value = "0.000001") BigDecimal quantity,
        @NotNull @DecimalMin(value = "0.0001") BigDecimal price,
        @NotNull LocalDateTime tradedAt,
        String note
) {}