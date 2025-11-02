package org.marketlab.marketlabbff;

import org.marketlab.marketlabbff.jwt.JwtFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {

    private final org.marketlab.marketlabbff.jwt.JwtValidator jwtValidator;

    public FilterConfig(org.marketlab.marketlabbff.jwt.JwtValidator jwtValidator) {
        this.jwtValidator = jwtValidator;
    }

    @Bean
    public JwtFilter jwtFilter() {
        return new JwtFilter(jwtValidator);
    }

    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration(JwtFilter jwtFilter) {
        FilterRegistrationBean<JwtFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(jwtFilter);
        registrationBean.addUrlPatterns("/api/*");
        registrationBean.setOrder(1);
        registrationBean.setEnabled(true);
        return registrationBean;
    }
}