package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.PortfolioSummaryResponse;
import com.poolfolio.backend.security.AuthenticatedMember;
import com.poolfolio.backend.service.PortfolioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryResponse> getSummary(@AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(portfolioService.getGroupSummary(principal));
    }
}