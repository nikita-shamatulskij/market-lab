package org.marketlab.marketlabbff.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductDTO {
    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private Integer stockQuantity;
    private String article;
    private Long categoryId;
    private String imageUrl;

    public String getSellerName() {
        return "MarketLab Seller";
    }
}