package org.marketlab.marketlabbff.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.marketlab.marketlabbff.dto.CategoryDTO;
import org.marketlab.marketlabbff.dto.ProductDTO;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MainController {

    private final WebClient productWebClient;
    private final WebClient categoryWebClient;

    @GetMapping("/")
    public String home(Model model) {
        List<ProductDTO> products = loadProductsFromService();
        model.addAttribute("products", products);

        List<CategoryDTO> categories = loadCategoriesFromService();
        model.addAttribute("categories", categories);

        return "index";
    }

    @GetMapping("/favorites")
    public String favorites(Model model) {
        List<CategoryDTO> categories = loadCategoriesFromService();
        model.addAttribute("categories", categories);
        return "favorites";
    }

    @GetMapping("/cart")
    public String cart(Model model) {
        List<CategoryDTO> categories = loadCategoriesFromService();
        model.addAttribute("categories", categories);
        return "cart";
    }

    private List<ProductDTO> loadProductsFromService() {
        try {
            String productsJson = productWebClient.get()
                    .uri("/api/product")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(productsJson, new TypeReference<List<ProductDTO>>(){});
        } catch (Exception e) {
            log.error("Error loading products: " + e.getMessage());
            return List.of();
        }
    }

    private List<CategoryDTO> loadCategoriesFromService() {
        try {
            String categoriesJson = categoryWebClient.get()
                    .uri("/api/category/all")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            ObjectMapper mapper = new ObjectMapper();
            List<CategoryDTO> categories = mapper.readValue(categoriesJson, new TypeReference<List<CategoryDTO>>(){});

            return categories;

        } catch (Exception e) {
            log.error("Error loading categories: " + e.getMessage(), e);
            return List.of();
        }
    }
}