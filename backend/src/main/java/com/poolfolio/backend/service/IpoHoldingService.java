package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.IpoHoldingRequest;
import com.poolfolio.backend.dto.IpoHoldingResponse;
import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.IpoHolding;
import com.poolfolio.backend.repository.InvestmentGroupRepository;
import com.poolfolio.backend.repository.IpoHoldingRepository;
import com.poolfolio.backend.security.AuthenticatedMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IpoHoldingService {

    private final IpoHoldingRepository ipoHoldingRepository;
    private final InvestmentGroupRepository groupRepository;

    public IpoHoldingService(IpoHoldingRepository ipoHoldingRepository, InvestmentGroupRepository groupRepository) {
        this.ipoHoldingRepository = ipoHoldingRepository;
        this.groupRepository = groupRepository;
    }

    @Transactional
    public IpoHoldingResponse create(AuthenticatedMember principal, IpoHoldingRequest request) {
        InvestmentGroup group = groupRepository.findById(principal.groupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + principal.groupId()));

        IpoHolding ipo = IpoHolding.builder()
                .group(group)
                .ipoName(request.ipoName())
                .amount(request.amount())
                .investedDate(request.investedDate())
                .build();

        return mapToResponse(ipoHoldingRepository.save(ipo));
    }

    @Transactional(readOnly = true)
    public List<IpoHoldingResponse> getGroupIpoHoldings(AuthenticatedMember principal) {
        return ipoHoldingRepository.findByGroupIdOrderByInvestedDateDesc(principal.groupId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public IpoHoldingResponse update(AuthenticatedMember principal, Long id, IpoHoldingRequest request) {
        IpoHolding ipo = getOwnedIpoHolding(principal, id);
        ipo.setIpoName(request.ipoName());
        ipo.setAmount(request.amount());
        ipo.setInvestedDate(request.investedDate());
        return mapToResponse(ipoHoldingRepository.save(ipo));
    }

    @Transactional
    public void delete(AuthenticatedMember principal, Long id) {
        ipoHoldingRepository.delete(getOwnedIpoHolding(principal, id));
    }

    private IpoHolding getOwnedIpoHolding(AuthenticatedMember principal, Long id) {
        return ipoHoldingRepository.findByIdAndGroupId(id, principal.groupId())
                .orElseThrow(() -> new IllegalArgumentException("IPO holding not found: " + id));
    }

    private IpoHoldingResponse mapToResponse(IpoHolding i) {
        return new IpoHoldingResponse(i.getId(), i.getGroup().getId(), i.getIpoName(), i.getAmount(), i.getInvestedDate());
    }
}