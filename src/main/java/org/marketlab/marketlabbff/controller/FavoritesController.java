package org.marketlab.marketlabbff.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.marketlab.marketlabbff.client.FavoriteServiceClient;
import org.marketlab.marketlabbff.client.ProductServiceClient;
import org.marketlab.marketlabbff.dto.ProductDTO;
import org.marketlab.marketlabbff.jwt.JwtValidator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final FavoriteServiceClient favoriteServiceClient;
    private final ProductServiceClient productServiceClient;
    private final JwtValidator jwtValidator;

    @PostMapping("/add/{productId}")
    public ResponseEntity<String> addFavorite(
            @PathVariable Long productId,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");

            if (userIdStr == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            Long userId = Long.parseLong(userIdStr);

            favoriteServiceClient.addFavorite(
                    request.getHeader("Authorization"),
                    userId,
                    productId
            );

            return ResponseEntity.ok("Товар добавлен в избранное");

        } catch (NumberFormatException e) {
            return ResponseEntity.status(400).body("Invalid userId in token");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<String> removeFavorite(
            @PathVariable Long productId,
            HttpServletRequest request) {

        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            Long userId = Long.parseLong(userIdStr);

            favoriteServiceClient.removeFavorite(
                    request.getHeader("Authorization"),
                    userId,
                    productId
            );

            return ResponseEntity.ok("Товар удален из избранного");

        } catch (NumberFormatException e) {
            return ResponseEntity.status(400).body("Invalid userId in token");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Long>> getFavorites(HttpServletRequest request) {
        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null) {
                return ResponseEntity.status(401).build();
            }

            Long userId = Long.parseLong(userIdStr);

            List<Long> favoriteIds = favoriteServiceClient.getFavoriteIds(
                    request.getHeader("Authorization"),
                    userId
            );

            return ResponseEntity.ok(favoriteIds);

        } catch (NumberFormatException e) {
            return ResponseEntity.status(400).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductDTO>> getFavoriteProducts(HttpServletRequest request) {
        try {
            String userIdStr = (String) request.getAttribute("userId");

            if (userIdStr == null) {
                return ResponseEntity.status(401).body(List.of());
            }

            Long userId = Long.parseLong(userIdStr);

            List<Long> favoriteIds = favoriteServiceClient.getFavoriteIds(
                    request.getHeader("Authorization"),
                    userId
            );

            if (favoriteIds == null || favoriteIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<ProductDTO> products = productServiceClient.getProductsByIds(
                    request.getHeader("Authorization"),
                    favoriteIds
            );

            if (products == null || products.isEmpty()) {
                products = productServiceClient.getProductsByIdsFallback(
                        request.getHeader("Authorization"),
                        favoriteIds
                );
            }

            return ResponseEntity.ok(products);

        } catch (NumberFormatException e) {
            return ResponseEntity.status(400).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/test-auth")
    public ResponseEntity<String> testAuth(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401).body("User not authenticated in filter. Check server logs for JWT validation errors.");
        }

        return ResponseEntity.ok("Auth OK! userId=" + userId);
    }
}