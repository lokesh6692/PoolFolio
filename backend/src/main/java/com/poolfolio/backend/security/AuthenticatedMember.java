package com.poolfolio.backend.security;

public record AuthenticatedMember(
        Long memberId,
        String email,
        Long groupId
) {}
