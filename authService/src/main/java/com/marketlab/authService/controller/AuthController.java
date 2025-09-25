package com.marketlab.authService.controller;

import com.marketlab.authService.dto.UserDTO;
import com.marketlab.authService.dto.requests.LoginRequest;
import com.marketlab.authService.dto.requests.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final PasswordEncoder passwordEncoder;
    private final WebClient userServiceClient;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        try {
            UserDTO user = userServiceClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/by-email")
                            .queryParam("email", request.email())
                            .build())
                    .retrieve()
                    .bodyToMono(UserDTO.class)
                    .block();

            if (passwordEncoder.matches(request.password(), user.password())) {
                return ResponseEntity.ok(
                        "Login successful. Hello, " + user.firstName() + " " + user.lastName());
            } else {
                return ResponseEntity.status(401).body("Invalid password");
            }

        } catch (WebClientResponseException.NotFound e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        String encodedPassword = passwordEncoder.encode(request.password());

        UserDTO newUser = new UserDTO(
                request.firstName(),
                request.middleName(),
                request.lastName(),
                request.email(),
                encodedPassword,
                request.phoneNumber()
        );

        try {
            userServiceClient.post()
                    .uri("/register")
                    .bodyValue(newUser)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            return ResponseEntity.status(201).body("User registered: " + request.email());
        } catch (WebClientResponseException e) {
            return ResponseEntity.status(e.getStatusCode()).body("Registration failed: " + e.getMessage());
        }
    }
}