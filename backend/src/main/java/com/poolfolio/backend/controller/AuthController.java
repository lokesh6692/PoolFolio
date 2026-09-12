package com.poolfolio.backend.controller;

import com.poolfolio.backend.dto.*;
import com.poolfolio.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup/create-group")
    public ResponseEntity<AuthResponse> signupCreateGroup(@Valid @RequestBody SignupCreateGroupRequest request) {
        return ResponseEntity.ok(authService.signupCreateGroup(request));
    }

    @PostMapping("/signup/join-group")
    public ResponseEntity<AuthResponse> signupJoinGroup(@Valid @RequestBody SignupJoinGroupRequest request) {
        return ResponseEntity.ok(authService.signupJoinGroup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
