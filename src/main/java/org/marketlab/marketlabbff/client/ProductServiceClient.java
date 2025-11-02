package org.marketlab.marketlabbff.client;

import org.marketlab.marketlabbff.dto.ProductDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
public class ProductServiceClient {

    private final WebClient webClient;

    public ProductServiceClient(@Qualifier("productWebClient") WebClient webClient){
        this.webClient = webClient;
    }

    public List<ProductDTO> getProductsByIds(String token, List<Long> ids) {
        try {
            String idsParam = String.join(",", ids.stream().map(String::valueOf).toArray(String[]::new));

            List<ProductDTO> products = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/product/batch")
                            .queryParam("ids", idsParam)
                            .build())
                    .header("Authorization", token)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<ProductDTO>>() {})
                    .block();

            return products != null ? products : List.of();

        } catch (Exception e) {
            return List.of();
        }
    }

    public List<ProductDTO> getProductsByIdsFallback(String token, List<Long> ids) {
        try {
            return ids.stream()
                    .map(id -> {
                        try {
                            ProductDTO product = webClient.get()
                                    .uri("/api/product/{id}", id)
                                    .header("Authorization", token)
                                    .retrieve()
                                    .bodyToMono(ProductDTO.class)
                                    .block();
                            return product;
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(product -> product != null)
                    .toList();

        } catch (Exception e) {
            return List.of();
        }
    }
}