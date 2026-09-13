package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.TradeRequest;
import com.poolfolio.backend.dto.TradeResponse;
import com.poolfolio.backend.security.AuthenticatedMember;
import com.poolfolio.backend.service.TradeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @PostMapping
    public ResponseEntity<TradeResponse> create(@AuthenticationPrincipal AuthenticatedMember principal, @Valid @RequestBody TradeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tradeService.create(principal, request));
    }

    @GetMapping
    public ResponseEntity<List<TradeResponse>> getAll(@AuthenticationPrincipal AuthenticatedMember principal) {
        return ResponseEntity.ok(tradeService.getGroupTrades(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TradeResponse> getOne(@AuthenticationPrincipal AuthenticatedMember principal, @PathVariable Long id) {
        return ResponseEntity.ok(tradeService.getTrade(principal, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TradeResponse> update(@AuthenticationPrincipal AuthenticatedMember principal, @PathVariable Long id, @Valid @RequestBody TradeRequest request) {
        return ResponseEntity.ok(tradeService.update(principal, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedMember principal, @PathVariable Long id) {
        tradeService.delete(principal, id);
        return ResponseEntity.noContent().build();
    }
}