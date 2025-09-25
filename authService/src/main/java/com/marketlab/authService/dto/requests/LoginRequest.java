package com.marketlab.authService.dto.requests;


public record LoginRequest(
        String email,
        String password
) {}