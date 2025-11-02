package org.marketlab.marketlabbff.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtValidator {

    private final Key signingKey;

    public JwtValidator(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    private Key getSigningKey() {
        return signingKey;
    }

    public void debugToken(String token) {
        try {
            String[] parts = token.split("\\.");

            if (parts.length >= 2) {
                String header = new String(java.util.Base64.getUrlDecoder().decode(parts[0]));
                String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            }

        } catch (Exception e) {
        }
    }

    public boolean validateToken(String token) {
        debugToken(token);

        try {
            Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUserIdFromToken(String token){
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}