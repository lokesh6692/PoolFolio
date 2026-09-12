package com.poolfolio.backend.dto;

public record AuthResponse(
        String token,
        Long memberId,
        String email,
        String displayName,
        Long groupId,
        String groupName,
        String inviteCode,
        String role
) {}
