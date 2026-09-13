package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.MemberProfitShareResponse;
import com.poolfolio.backend.dto.ValuationSnapshotRequest;
import com.poolfolio.backend.dto.ValuationSnapshotResponse;
import com.poolfolio.backend.entity.ContributionType;
import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.IpoHolding;
import com.poolfolio.backend.entity.Member;
import com.poolfolio.backend.entity.ProfitShare;
import com.poolfolio.backend.entity.ValuationSnapshot;
import com.poolfolio.backend.repository.ContributionRepository;
import com.poolfolio.backend.repository.HoldingRepository;
import com.poolfolio.backend.repository.InvestmentGroupRepository;
import com.poolfolio.backend.repository.IpoHoldingRepository;
import com.poolfolio.backend.repository.MemberRepository;
import com.poolfolio.backend.repository.ProfitShareRepository;
import com.poolfolio.backend.repository.ValuationSnapshotRepository;
import com.poolfolio.backend.security.AuthenticatedMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ValuationService {

    private final InvestmentGroupRepository groupRepository;
    private final ValuationSnapshotRepository valuationSnapshotRepository;
    private final ProfitShareRepository profitShareRepository;
    private final MemberRepository memberRepository;
    private final ContributionRepository contributionRepository;
    private final HoldingRepository holdingRepository;
    private final IpoHoldingRepository ipoHoldingRepository;
    private final NavUnitService navUnitService;
    private final RealizedPnlService realizedPnlService;

    public ValuationService(InvestmentGroupRepository groupRepository,
                             ValuationSnapshotRepository valuationSnapshotRepository,
                             ProfitShareRepository profitShareRepository,
                             MemberRepository memberRepository,
                             ContributionRepository contributionRepository,
                             HoldingRepository holdingRepository,
                             IpoHoldingRepository ipoHoldingRepository,
                             NavUnitService navUnitService,
                             RealizedPnlService realizedPnlService) {
        this.groupRepository = groupRepository;
        this.valuationSnapshotRepository = valuationSnapshotRepository;
        this.profitShareRepository = profitShareRepository;
        this.memberRepository = memberRepository;
        this.contributionRepository = contributionRepository;
        this.holdingRepository = holdingRepository;
        this.ipoHoldingRepository = ipoHoldingRepository;
        this.navUnitService = navUnitService;
        this.realizedPnlService = realizedPnlService;
    }

    @Transactional
    public ValuationSnapshotResponse createSnapshot(AuthenticatedMember principal, ValuationSnapshotRequest request) {
        InvestmentGroup group = groupRepository.findById(principal.groupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + principal.groupId()));

        ValuationSnapshot snapshot = ValuationSnapshot.builder()
                .group(group)
                .totalValue(request.totalValue())
                .snapshotAt(request.snapshotAt())
                .build();
        ValuationSnapshot saved = valuationSnapshotRepository.save(snapshot);

        List<Member> members = memberRepository.findByGroupId(group.getId());
        BigDecimal totalUnitsAsOf = navUnitService.getTotalUnitsOutstandingAsOf(group.getId(), saved.getSnapshotAt());

        // NOTE: Holdings/IpoHolding have no historical "as of" state pre-Phase-6 (same
        // limitation already documented for NAV pricing), so total-invested uses the
        // group's CURRENT holdings value, allocated by each member's unit-share as of
        // the snapshot time. Revisit once Phase 6 adds point-in-time pricing.
        BigDecimal stockHoldingsValue = holdingRepository.findByGroupIdOrderBySymbolAsc(group.getId()).stream()
                .map(h -> h.getQuantity().multiply(h.getAverageCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ipoHoldingsValue = ipoHoldingRepository.findByGroupIdOrderByInvestedDateDesc(group.getId()).stream()
                .map(IpoHolding::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalHoldingsValue = stockHoldingsValue.add(ipoHoldingsValue);

        return new ValuationSnapshotResponse(
                saved.getId(),
                group.getId(),
                saved.getTotalValue(),
                saved.getSnapshotAt(),
                members.stream()
                        .map(member -> computeMemberProfitShare(member, saved, totalUnitsAsOf, totalHoldingsValue))
                        .toList()
        );
    }

    private MemberProfitShareResponse computeMemberProfitShare(Member member, ValuationSnapshot snapshot,
                                                                 BigDecimal totalUnitsAsOf, BigDecimal totalHoldingsValue) {
        BigDecimal unitsHeld = navUnitService.getMemberUnitsAsOf(member.getId(), snapshot.getSnapshotAt());

        BigDecimal unitShareFraction = totalUnitsAsOf.compareTo(BigDecimal.ZERO) > 0
                ? unitsHeld.divide(totalUnitsAsOf, 10, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal unitSharePercentage = unitShareFraction.multiply(BigDecimal.valueOf(100))
                .setScale(6, RoundingMode.HALF_UP);

        BigDecimal deposits = contributionRepository.sumAmountByMemberIdAndTypeAsOf(
                member.getId(), ContributionType.DEPOSIT, snapshot.getSnapshotAt());
        BigDecimal withdrawals = contributionRepository.sumAmountByMemberIdAndTypeAsOf(
                member.getId(), ContributionType.WITHDRAWAL, snapshot.getSnapshotAt());
        BigDecimal totalContributed = deposits.subtract(withdrawals);

        BigDecimal totalInvested = unitShareFraction.multiply(totalHoldingsValue).setScale(2, RoundingMode.HALF_UP);
        BigDecimal availableCashWithoutPl = totalContributed.subtract(totalInvested);

        BigDecimal realizedProfitLoss = realizedPnlService.getMemberRealizedPnlAsOf(
                member.getGroup().getId(), member.getId(), snapshot.getSnapshotAt());
        BigDecimal availableCashWithPl = availableCashWithoutPl.add(realizedProfitLoss);

        BigDecimal currentValue = unitShareFraction.multiply(snapshot.getTotalValue()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitLoss = currentValue.subtract(totalContributed);

        ProfitShare profitShare = ProfitShare.builder()
                .valuation(snapshot)
                .member(member)
                .ownershipPercentage(unitSharePercentage)
                .contributedAmount(totalContributed)
                .currentValue(currentValue)
                .profitLoss(profitLoss)
                .unitsHeld(unitsHeld)
                .totalContributed(totalContributed)
                .totalInvested(totalInvested)
                .availableCashWithoutPl(availableCashWithoutPl)
                .realizedProfitLoss(realizedProfitLoss)
                .availableCashWithPl(availableCashWithPl)
                .build();
        profitShareRepository.save(profitShare);

        return new MemberProfitShareResponse(
                member.getId(), member.getDisplayName(), unitsHeld, unitSharePercentage,
                totalContributed, totalInvested, availableCashWithoutPl,
                realizedProfitLoss, availableCashWithPl, currentValue, profitLoss
        );
    }

    @Transactional(readOnly = true)
    public ValuationSnapshotResponse getSnapshot(AuthenticatedMember principal, Long valuationId) {
        ValuationSnapshot snapshot = valuationSnapshotRepository.findById(valuationId)
                .orElseThrow(() -> new IllegalArgumentException("Valuation snapshot not found: " + valuationId));
        if (!snapshot.getGroup().getId().equals(principal.groupId())) {
            throw new IllegalArgumentException("Valuation snapshot does not belong to your group");
        }
        return toResponse(snapshot);
    }

    @Transactional(readOnly = true)
    public ValuationSnapshotResponse getLatestSnapshot(AuthenticatedMember principal) {
        ValuationSnapshot snapshot = valuationSnapshotRepository.findTopByGroupIdOrderBySnapshotAtDesc(principal.groupId())
                .orElseThrow(() -> new IllegalArgumentException("No valuation snapshot exists yet for this group"));
        return toResponse(snapshot);
    }

    private ValuationSnapshotResponse toResponse(ValuationSnapshot snapshot) {
        List<MemberProfitShareResponse> memberShares = profitShareRepository.findByValuationIdOrderByMemberIdAsc(snapshot.getId())
                .stream()
                .map(ps -> new MemberProfitShareResponse(
                        ps.getMember().getId(), ps.getMember().getDisplayName(), ps.getUnitsHeld(), ps.getOwnershipPercentage(),
                        ps.getTotalContributed(), ps.getTotalInvested(), ps.getAvailableCashWithoutPl(),
                        ps.getRealizedProfitLoss(), ps.getAvailableCashWithPl(), ps.getCurrentValue(), ps.getProfitLoss()
                ))
                .toList();
        return new ValuationSnapshotResponse(snapshot.getId(), snapshot.getGroup().getId(), snapshot.getTotalValue(), snapshot.getSnapshotAt(), memberShares);
    }
}
