package com.poolfolio.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IpoHoldingRequest(
        @NotBlank String ipoName,
        @NotNull @DecimalMin(value = "0.0") BigDecimal amount,
        @NotNull LocalDate investedDate
) {}