package com.investai.auth.service;

import com.investai.auth.model.User;
import com.investai.auth.repository.UserRepository;
import com.investai.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import java.util.Map;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public Map<String, Object> register(String email, String fullName, String password) {
        userRepository.findByEmail(email).ifPresent(existing -> {
            throw new IllegalArgumentException("User already exists");
        });

        User user = new User(email, fullName, passwordEncoder.encode(password));
        userRepository.save(user);
        return issueTokens(email, fullName);
    }

    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.passwordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return issueTokens(user.email(), user.fullName());
    }

    public Map<String, Object> refresh(String refreshToken) {
        Claims claims = jwtService.parseToken(refreshToken);
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        String email = claims.getSubject();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User no longer exists"));
        return issueTokens(user.email(), user.fullName());
    }

    public Map<String, Object> validate(String accessToken) {
        Claims claims = jwtService.parseToken(accessToken);
        if (!"access".equals(claims.get("type", String.class))) {
            return Map.of("valid", false);
        }
        return Map.of("valid", true, "email", claims.getSubject());
    }

    private Map<String, Object> issueTokens(String email, String fullName) {
        return Map.of(
                "email", email,
                "fullName", fullName,
                "accessToken", jwtService.createAccessToken(email),
                "refreshToken", jwtService.createRefreshToken(email)
        );
    }
}
