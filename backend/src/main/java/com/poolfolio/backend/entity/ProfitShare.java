package com.poolfolio.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "profit_shares", uniqueConstraints = @UniqueConstraint(columnNames = {"valuation_id", "member_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valuation_id", nullable = false)
    @ToString.Exclude
    private ValuationSnapshot valuation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @ToString.Exclude
    private Member member;

    @Column(name = "ownership_percentage", nullable = false, precision = 9, scale = 6)
    private BigDecimal ownershipPercentage;

    @Column(name = "contributed_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal contributedAmount;

    @Column(name = "current_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "profit_loss", nullable = false, precision = 15, scale = 2)
    private BigDecimal profitLoss;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
