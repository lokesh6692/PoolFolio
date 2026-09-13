package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.ValuationSnapshotRequest;
import com.poolfolio.backend.dto.ValuationSnapshotResponse;
import com.poolfolio.backend.security.AuthenticatedMember;
import com.poolfolio.backend.service.ValuationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/valuations")
public class ValuationController {

    private final ValuationService valuationService;

    public ValuationController(ValuationService valuationService) {
        this.valuationService = valuationService;
    }

    @PostMapping
    public ResponseEntity<ValuationSnapshotResponse> createSnapshot(
            @AuthenticationPrincipal AuthenticatedMember principal,
            @Valid @RequestBody ValuationSnapshotRequest request) {
        ValuationSnapshotResponse response = valuationService.createSnapshot(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/latest")
    public ResponseEntity<ValuationSnapshotResponse> getLatest(@AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(valuationService.getLatestSnapshot(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ValuationSnapshotResponse> getById(
            @AuthenticationPrincipal AuthenticatedMember principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(valuationService.getSnapshot(principal, id));
    }
}
