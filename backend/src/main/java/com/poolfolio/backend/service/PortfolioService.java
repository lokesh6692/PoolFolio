package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.PortfolioSummaryResponse;
import com.poolfolio.backend.entity.ContributionType;
import com.poolfolio.backend.entity.Holding;
import com.poolfolio.backend.entity.IpoHolding;
import com.poolfolio.backend.repository.ContributionRepository;
import com.poolfolio.backend.repository.HoldingRepository;
import com.poolfolio.backend.repository.IpoHoldingRepository;
import com.poolfolio.backend.security.AuthenticatedMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PortfolioService {

    private final ContributionRepository contributionRepository;
    private final HoldingRepository holdingRepository;
    private final IpoHoldingRepository ipoHoldingRepository;

    public PortfolioService(ContributionRepository contributionRepository, HoldingRepository holdingRepository, IpoHoldingRepository ipoHoldingRepository) {
        this.contributionRepository = contributionRepository;
        this.holdingRepository = holdingRepository;
        this.ipoHoldingRepository = ipoHoldingRepository;
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getGroupSummary(AuthenticatedMember principal) {
        Long groupId = principal.groupId();

        BigDecimal deposits = contributionRepository.sumAmountByGroupIdAndType(groupId, ContributionType.DEPOSIT);
        BigDecimal withdrawals = contributionRepository.sumAmountByGroupIdAndType(groupId, ContributionType.WITHDRAWAL);
        BigDecimal totalContributed = deposits.subtract(withdrawals);

        List<Holding> holdings = holdingRepository.findByGroupIdOrderBySymbolAsc(groupId);
        BigDecimal stockHoldingsValue = holdings.stream()
                .map(h -> h.getQuantity().multiply(h.getAverageCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<IpoHolding> ipoHoldings = ipoHoldingRepository.findByGroupIdOrderByInvestedDateDesc(groupId);
        BigDecimal ipoHoldingsValue = ipoHoldings.stream()
                .map(IpoHolding::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal availableCash = totalContributed.subtract(stockHoldingsValue.add(ipoHoldingsValue));

        return new PortfolioSummaryResponse(groupId, totalContributed, stockHoldingsValue, ipoHoldingsValue, availableCash);
    }
}