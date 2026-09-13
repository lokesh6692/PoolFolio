package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.ContributionRequest;
import com.poolfolio.backend.dto.ContributionResponse;
import com.poolfolio.backend.dto.ContributionTotalResponse;
import com.poolfolio.backend.entity.Contribution;
import com.poolfolio.backend.entity.ContributionType;
import com.poolfolio.backend.entity.Member;
import com.poolfolio.backend.repository.ContributionRepository;
import com.poolfolio.backend.repository.MemberRepository;
import com.poolfolio.backend.security.AuthenticatedMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ContributionService {

    private final ContributionRepository contributionRepository;
    private final MemberRepository memberRepository;

    public ContributionService(ContributionRepository contributionRepository, MemberRepository memberRepository) {
        this.contributionRepository = contributionRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public ContributionResponse create(AuthenticatedMember principal, ContributionRequest request) {
        Member member = memberRepository.findById(principal.memberId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + principal.memberId()));

        Contribution contribution = Contribution.builder()
                .member(member)
                .group(member.getGroup())
                .amount(request.amount())
                .type(request.type())
                .note(request.note())
                .contributedAt(request.contributedAt())
                .build();

        Contribution saved = contributionRepository.save(contribution);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ContributionResponse> getMyContributions(AuthenticatedMember principal) {
        return contributionRepository.findByMemberIdOrderByContributedAtDesc(principal.memberId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContributionTotalResponse getMyRunningTotal(AuthenticatedMember principal) {
        BigDecimal deposits = contributionRepository.sumAmountByMemberIdAndType(
                principal.memberId(), ContributionType.DEPOSIT);
        BigDecimal withdrawals = contributionRepository.sumAmountByMemberIdAndType(
                principal.memberId(), ContributionType.WITHDRAWAL);

        return new ContributionTotalResponse(
                deposits,
                withdrawals,
                deposits.subtract(withdrawals)
        );
    }

    @Transactional(readOnly = true)
    public ContributionTotalResponse getGroupRunningTotal(AuthenticatedMember principal) {
        BigDecimal deposits = contributionRepository.sumAmountByGroupIdAndType(
                principal.groupId(), ContributionType.DEPOSIT);
        BigDecimal withdrawals = contributionRepository.sumAmountByGroupIdAndType(
                principal.groupId(), ContributionType.WITHDRAWAL);

        return new ContributionTotalResponse(
                deposits,
                withdrawals,
                deposits.subtract(withdrawals)
        );
    }

    private ContributionResponse mapToResponse(Contribution c) {
        return new ContributionResponse(
                c.getId(),
                c.getMember().getId(),
                c.getMember().getDisplayName(),
                c.getGroup().getId(),
                c.getAmount(),
                c.getType(),
                c.getNote(),
                c.getContributedAt()
        );
    }
}
