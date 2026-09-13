package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.HoldingResponse;
import com.poolfolio.backend.security.AuthenticatedMember;
import com.poolfolio.backend.service.HoldingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/holdings")
public class HoldingController {

    private final HoldingService holdingService;

    public HoldingController(HoldingService holdingService) {
        this.holdingService = holdingService;
    }

    @GetMapping
    public ResponseEntity<List<HoldingResponse>> getAll(@AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(holdingService.getGroupHoldings(principal.groupId()));
    }

    @GetMapping("/{symbol}")
    public ResponseEntity<HoldingResponse> getOne(@AuthenticationPrincipal AuthenticatedMember principal, @PathVariable String symbol) {
        return ResponseEntity.ok(holdingService.getHolding(principal.groupId(), symbol));
    }
}