package com.poolfolio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ValuationSnapshotResponse(
        Long id,
        Long groupId,
        BigDecimal totalValue,
        LocalDateTime snapshotAt,
        List<MemberProfitShareResponse> memberShares
) {}
