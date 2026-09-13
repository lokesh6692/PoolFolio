package com.poolfolio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HoldingResponse(
        Long id,
        Long groupId,
        String symbol,
        BigDecimal quantity,
        BigDecimal averageCost,
        LocalDateTime updatedAt
) {}