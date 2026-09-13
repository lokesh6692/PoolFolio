package com.poolfolio.backend.repository;

import com.poolfolio.backend.entity.IpoHolding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IpoHoldingRepository extends JpaRepository<IpoHolding, Long> {
    List<IpoHolding> findByGroupIdOrderByInvestedDateDesc(Long groupId);
    Optional<IpoHolding> findByIdAndGroupId(Long id, Long groupId);
}