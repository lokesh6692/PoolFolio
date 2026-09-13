package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.ValuationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ValuationSnapshotRepository extends JpaRepository<ValuationSnapshot, Long> {
    Optional<ValuationSnapshot> findTopByGroupIdOrderBySnapshotAtDesc(Long groupId);
}