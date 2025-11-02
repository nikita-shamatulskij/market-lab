// JwtFilter.java
package org.marketlab.marketlabbff.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtFilter extends OncePerRequestFilter {

    private final JwtValidator jwtValidator;

    private final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/product",
            "/api/product/search",
            "/api/product/category/",
            "/",
            "/product/"
    );

    public JwtFilter(JwtValidator jwtValidator) {
        this.jwtValidator = jwtValidator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();

        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Missing or invalid Authorization header");
            response.getWriter().flush();
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtValidator.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Invalid JWT token");
            response.getWriter().flush();
            return;
        }

        String userId = jwtValidator.getUserIdFromToken(token);

        if (userId == null || userId.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("User ID not found in token");
            response.getWriter().flush();
            return;
        }

        request.setAttribute("userId", userId);
        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        if (path.startsWith("/api/favorites") || path.startsWith("/api/cart")) {
            return false;
        }

        return PUBLIC_PATHS.stream().anyMatch(publicPath ->
                path.equals(publicPath) ||
                        (publicPath.endsWith("/") && path.startsWith(publicPath))
        );
    }
}