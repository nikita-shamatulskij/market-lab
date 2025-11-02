package org.marketlab.marketlabbff.controller;

import org.marketlab.marketlabbff.dto.ProductDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.reactive.function.client.WebClient;

@Controller
public class ProductDetailController {

    private final WebClient productWebClient;

    public ProductDetailController(@Qualifier("productWebClient") WebClient productWebClient) {
        this.productWebClient = productWebClient;
    }

    @GetMapping("/product/{id}")
    public String productDetail(@PathVariable Long id, Model model) {
        try {
            ProductDTO product = productWebClient.get()
                    .uri("/api/product/{id}", id)
                    .retrieve()
                    .bodyToMono(ProductDTO.class)
                    .block();

            model.addAttribute("product", product);
            return "product-detail";

        } catch (Exception e) {
            return "redirect:/";
        }
    }
}