package org.marketlab.marketlabbff.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Objects;

@Service
public class FavoriteServiceClient {

    private final WebClient webClient;

    public FavoriteServiceClient(@Qualifier("favoriteWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public void addFavorite(String authHeader, Long userId, Long productId) {
        try {
            String responseBody = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/favorites/add/{productId}")
                            .build(productId))
                    .header("Authorization", authHeader != null ? authHeader : "")
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            String responseBody = "";
            try {
                responseBody = e.getResponseBodyAsString();
            } catch (Exception ignored) {}

            throw new RuntimeException("Failed to add favorite: " + e.getStatusCode() + " - " + responseBody);
        } catch (Exception e) {
            throw new RuntimeException("Failed to add favorite: " + e.getMessage());
        }
    }

    public void removeFavorite(String authHeader, Long userId, Long productId) {
        try {
            ResponseEntity<Void> response = webClient.delete()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/favorites/delete/{productId}")
                            .build(productId))
                    .header("Authorization", authHeader)
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .toBodilessEntity()
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Failed to remove favorite: " + e.getMessage());
        }
    }

    public List<Long> getFavoriteIds(String authHeader, Long userId) {
        try {
            List<JsonNode> favorites = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/favorites")
                            .queryParam("userId", userId)
                            .build())
                    .header("Authorization", authHeader)
                    .retrieve()
                    .bodyToFlux(JsonNode.class)
                    .collectList()
                    .block();

            if (favorites == null || favorites.isEmpty()) {
                return List.of();
            }

            List<Long> productIds = favorites.stream()
                    .map(node -> {
                        try {
                            return node.get("productId").asLong();
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .toList();

            return productIds;

        } catch (Exception e) {
            throw new RuntimeException("Failed to get favorites: " + e.getMessage());
        }
    }
}