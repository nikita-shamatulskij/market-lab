package com.marketlab.authService.service;

import com.marketlab.authService.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class UserClient {

    private final WebClient userServiceWebClient;

    public UserDTO getUserByEmail(String email) {
        return userServiceWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users/by-email")
                        .queryParam("email", email)
                        .build())
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> {
                    throw new UsernameNotFoundException("User not found");
                })
                .bodyToMono(UserDTO.class)
                .block();
    }
}
