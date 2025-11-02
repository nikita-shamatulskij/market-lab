package org.marketlab.marketlabbff.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@RequestMapping("/api/product")
@RequiredArgsConstructor
public class BffProductController {

    private final WebClient productWebClient;

    @GetMapping
    public ResponseEntity<String> getProducts() {
        try {
            String products = productWebClient.get()
                    .uri("/api/product")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка загрузки товаров: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchProducts(@RequestParam String q) {
        try {
            String response = productWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/product/search")
                            .queryParam("q", q)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка поиска товаров: " + e.getMessage());
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<String> getProductsByCategory(@PathVariable Long categoryId) {
        try {
            String products = productWebClient.get()
                    .uri("/api/product/category/{categoryId}", categoryId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка загрузки товаров категории: " + e.getMessage());
        }
    }
}