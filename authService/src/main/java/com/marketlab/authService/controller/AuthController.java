package com.marketlab.authService.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authRequest =
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            loginRequest.email(),
                            loginRequest.password());
            Authentication authResponse =
                    this.authenticationManager.authenticate(authRequest);
            SecurityContextHolder.getContext().setAuthentication(authResponse);

            return ResponseEntity.ok("login is successfully: " + authResponse.getName());
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("invalid email or password");
        }
    }

    public record LoginRequest(String email, String password) {
    }
}
