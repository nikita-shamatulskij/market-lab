package com.marketlab.authService.dto;


public record UserDto(
        Long id,
        String email,
        String passwordHash
) {}
