package org.marketlab.marketlabbff.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    public WebClient productWebClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:8089")
                .build();
    }

    @Bean
    public WebClient authWebClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:8081")
                .build();
    }

    @Bean
    public WebClient categoryWebClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:8088")
                .build();
    }

    @Bean
    public WebClient favoriteWebClient(){
        return WebClient.builder()
                .baseUrl("http://localhost:8090")
                .build();
    }

    @Bean
    public WebClient cartWebClient(){
        return WebClient.builder()
                .baseUrl("http://localhost:8093")
                .build();
    }

    @Bean
    public WebClient userWebClient(){
        return WebClient.builder()
                .baseUrl("http://localhost:8092")
                .build();
    }
}