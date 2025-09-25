package com.marketlab.authService.dto.requests;


public record RegisterRequest(
        String firstName,
        String middleName,
        String lastName,
        String email,
        String password,
        String phoneNumber
) {}