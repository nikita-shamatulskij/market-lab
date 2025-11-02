package org.marketlab.marketlabbff.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class CartServiceClient {
    private final WebClient webClient;

    public CartServiceClient(@Qualifier("cartWebClient") WebClient webClient){
        this.webClient = webClient;
    }

    public void addToCart(String authHeader, Long userId, Long productId){
        webClient
                .post()
                .uri("/api/cart/add/{productId}", productId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-User-Id", userId.toString())
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public void removeFromCart(String authHeader, Long userId, Long productId){
        webClient
                .delete()
                .uri("/api/cart/items/{productId}", productId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-User-Id", userId.toString())
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public Object getUserCart(String authHeader, Long userId){
        return webClient
                .get()
                .uri("/api/cart")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-User-Id", userId.toString())
                .retrieve()
                .bodyToMono(Object.class)
                .block();
    }

    public void updateQuantity(String authHeader, Long userId, Long productId, Integer quantity){
        webClient.put()
                .uri("/api/cart/update/{productId}/{quantity}", userId, productId, quantity)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-User-Id", userId.toString())
                .retrieve()
                .toBodilessEntity()
                .block();
    }
}