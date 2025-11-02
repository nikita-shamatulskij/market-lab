package org.marketlab.marketlabbff.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.marketlab.marketlabbff.client.CartServiceClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartServiceClient cartServiceClient;

    @PostMapping("/add/{productId}")
    public ResponseEntity<String> addToCart(@PathVariable Long productId, HttpServletRequest request) {
        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null) return ResponseEntity.status(401).body("User not authenticated");

            Long userId = Long.parseLong(userIdStr);
            cartServiceClient.addToCart(request.getHeader("Authorization"), userId, productId);

            return ResponseEntity.ok("Товар добавлен в корзину");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserCart(HttpServletRequest request){
        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null) return ResponseEntity.status(401).body("User not authenticated");

            Long userId = Long.parseLong(userIdStr);
            Object cart = cartServiceClient.getUserCart(request.getHeader("Authorization"), userId);

            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    @PutMapping("/update/{productId}/{quantity}")
    public ResponseEntity<String> updateQuantity(@PathVariable Long productId,
                                                 @PathVariable Integer quantity,
                                                 HttpServletRequest request) {
        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null) return ResponseEntity.status(401).body("User not authenticated");

            Long userId = Long.parseLong(userIdStr);
            cartServiceClient.updateQuantity(request.getHeader("Authorization"), userId, productId, quantity);

            return ResponseEntity.ok("Количество товара в корзине обновлено");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<String> removeFromCart(@PathVariable Long productId, HttpServletRequest request){
        try {
            String userIdStr = (String) request.getAttribute("userId");
            if (userIdStr == null) return ResponseEntity.status(401).body("User not authenticated");

            Long userId = Long.parseLong(userIdStr);
            cartServiceClient.removeFromCart(request.getHeader("Authorization"), userId, productId);

            return ResponseEntity.ok("Товар удален из корзины");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка: " + e.getMessage());
        }
    }

}