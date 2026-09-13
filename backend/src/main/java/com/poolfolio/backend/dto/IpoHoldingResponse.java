package com.poolfolio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IpoHoldingResponse(
        Long id,
        Long groupId,
        String ipoName,
        BigDecimal amount,
        LocalDate investedDate
) {}