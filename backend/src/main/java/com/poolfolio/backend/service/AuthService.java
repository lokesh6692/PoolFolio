package com.poolfolio.backend.service;

import com.poolfolio.backend.dto.*;
import com.poolfolio.backend.entity.InvestmentGroup;
import com.poolfolio.backend.entity.Member;
import com.poolfolio.backend.entity.MemberRole;
import com.poolfolio.backend.repository.InvestmentGroupRepository;
import com.poolfolio.backend.repository.MemberRepository;
import com.poolfolio.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final String INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int INVITE_CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    private final MemberRepository memberRepository;
    private final InvestmentGroupRepository groupRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            MemberRepository memberRepository,
            InvestmentGroupRepository groupRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.memberRepository = memberRepository;
        this.groupRepository = groupRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse signupCreateGroup(SignupCreateGroupRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        String inviteCode = generateUniqueInviteCode();

        InvestmentGroup group = InvestmentGroup.builder()
                .name(request.groupName())
                .inviteCode(inviteCode)
                .build();
        group = groupRepository.save(group);

        Member member = Member.builder()
                .group(group)
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .role(MemberRole.ADMIN)
                .build();
        member = memberRepository.save(member);

        return buildAuthResponse(member, group);
    }

    @Transactional
    public AuthResponse signupJoinGroup(SignupJoinGroupRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        InvestmentGroup group = groupRepository.findByInviteCode(request.inviteCode())
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite code"));

        Member member = Member.builder()
                .group(group)
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .role(MemberRole.MEMBER)
                .build();
        member = memberRepository.save(member);

        return buildAuthResponse(member, group);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), member.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return buildAuthResponse(member, member.getGroup());
    }

    private AuthResponse buildAuthResponse(Member member, InvestmentGroup group) {
        String token = jwtUtil.generateToken(member.getId(), member.getEmail(), group.getId());
        return new AuthResponse(
                token,
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                group.getId(),
                group.getName(),
                group.getInviteCode(),
                member.getRole().name()
        );
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
            for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
                sb.append(INVITE_CODE_CHARS.charAt(random.nextInt(INVITE_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (groupRepository.existsByInviteCode(code));
        return code;
    }
}
