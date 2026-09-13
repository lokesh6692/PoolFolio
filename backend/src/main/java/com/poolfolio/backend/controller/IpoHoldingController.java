package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.IpoHoldingRequest;
import com.poolfolio.backend.dto.IpoHoldingResponse;
import com.poolfolio.backend.security.AuthenticatedMember;
import com.poolfolio.backend.service.IpoHoldingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ipo-holdings")
public class IpoHoldingController {

    private final IpoHoldingService ipoHoldingService;

    public IpoHoldingController(IpoHoldingService ipoHoldingService) {
        this.ipoHoldingService = ipoHoldingService;
    }

    @PostMapping
    public ResponseEntity<IpoHoldingResponse> create(@AuthenticationPrincipal AuthenticatedMember principal, @Valid @RequestBody IpoHoldingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ipoHoldingService.create(principal, request));
    }

    @GetMapping
    public ResponseEntity<List<IpoHoldingResponse>> getAll(@AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(ipoHoldingService.getGroupIpoHoldings(principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IpoHoldingResponse> update(@AuthenticationPrincipal AuthenticatedMember principal, @PathVariable Long id, @Valid @RequestBody IpoHoldingRequest request) {
        return ResponseEntity.ok(ipoHoldingService.update(principal, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedMember principal, @PathVariable Long id) {
        ipoHoldingService.delete(principal, id);
        return ResponseEntity.noContent().build();
    }
}