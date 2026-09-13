package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.ContributionRequest;
import com.poolfolio.backend.dto.ContributionResponse;
import com.poolfolio.backend.dto.ContributionTotalResponse;
import com.poolfolio.backend.security.AuthenticatedMember;
import com.poolfolio.backend.service.ContributionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contributions")
public class ContributionController {

    private final ContributionService contributionService;

    public ContributionController(ContributionService contributionService) {
        this.contributionService = contributionService;
    }

    @PostMapping
    public ResponseEntity<ContributionResponse> create(
            @AuthenticationPrincipal AuthenticatedMember principal,
            @Valid @RequestBody ContributionRequest request) {
        ContributionResponse response = contributionService.create(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<ContributionResponse>> getMyContributions(
            @AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(contributionService.getMyContributions(principal));
    }

    @GetMapping("/me/total")
    public ResponseEntity<ContributionTotalResponse> getMyRunningTotal(
            @AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(contributionService.getMyRunningTotal(principal));
    }

    @GetMapping("/group/total")
    public ResponseEntity<ContributionTotalResponse> getGroupRunningTotal(
            @AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(contributionService.getGroupRunningTotal(principal));
    }
}
