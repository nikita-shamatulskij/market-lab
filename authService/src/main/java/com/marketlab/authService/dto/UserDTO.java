package com.marketlab.authService.dto;

public record UserDTO(
        String firstName,
        String middleName,
        String lastName,
        String email,
        String password,
        String phoneNumber
) {}
