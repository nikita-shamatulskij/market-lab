package org.marketlab.marketlabbff.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.marketlab.marketlabbff.dto.AuthResponse;
import org.marketlab.marketlabbff.dto.LoginRequest;
import org.marketlab.marketlabbff.dto.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class BffAuthController {

    private final WebClient authWebClient;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Пароль должен содержать минимум 6 символов");
            }

            if (request.getEmail() == null || !request.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                return ResponseEntity.badRequest().body("Неверный формат email");
            }

            ResponseEntity<String> authResponse = authWebClient.post()
                    .uri("/register")
                    .bodyValue(request)
                    .exchangeToMono(clientResponse -> {
                        return clientResponse.toEntity(String.class);
                    })
                    .block();

            return ResponseEntity.status(authResponse.getStatusCode())
                    .body(authResponse.getBody());

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка соединения с сервером аутентификации");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            ResponseEntity<AuthResponse> authResponse = authWebClient.post()
                    .uri("/login")
                    .bodyValue(request)
                    .retrieve()
                    .toEntity(AuthResponse.class)
                    .block();

            return ResponseEntity.status(authResponse.getStatusCode())
                    .body(authResponse.getBody());

        } catch (Exception e) {
            AuthResponse error = new AuthResponse(null, "Ошибка соединения", null, null, null);
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validateToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("No token provided");
        }

        String token = authHeader.substring(7);


        if (token.length() < 10) {
            return ResponseEntity.status(401).body("Token too short");
        }

        return ResponseEntity.ok("Token format looks OK");
    }
}