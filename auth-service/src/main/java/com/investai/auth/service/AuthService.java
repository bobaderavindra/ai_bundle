package com.investai.auth.service;

import com.investai.auth.model.RefreshToken;
import com.investai.auth.model.User;
import com.investai.auth.repository.RefreshTokenRepository;
import com.investai.auth.repository.UserRepository;
import com.investai.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final long refreshTokenTtlSeconds;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            @org.springframework.beans.factory.annotation.Value("${auth.jwt.refresh-ttl-seconds}") long refreshTokenTtlSeconds
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    }

    @Transactional
    public Map<String, Object> register(String email, String fullName, String password) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            throw new IllegalArgumentException("User already exists");
        });

        User user = new User(email.toLowerCase(), passwordEncoder.encode(password), "USER", true);
        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getIsEnabled())) {
            throw new IllegalArgumentException("User is disabled");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return issueTokens(user);
    }

    @Transactional
    public Map<String, Object> refresh(String refreshToken) {
        RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));
        if (Boolean.TRUE.equals(stored.getRevoked()) || stored.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Refresh token expired or revoked");
        }

        Claims claims = jwtService.parseToken(refreshToken);
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        User user = stored.getUser();
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(user);
    }

    public Map<String, Object> validate(String accessToken) {
        Claims claims = jwtService.parseToken(accessToken);
        if (!"access".equals(claims.get("type", String.class))) {
            return Map.of("valid", false);
        }
        return Map.of(
                "valid", true,
                "email", claims.getSubject(),
                "userId", claims.get("uid", String.class),
                "role", claims.get("role", String.class),
                "roles", claims.get("roles")
        );
    }

    public Map<String, Object> me(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User no longer exists"));
        return Map.of(
                "email", user.getEmail(),
                "userId", user.getId(),
                "role", user.getRole(),
                "enabled", user.getIsEnabled(),
                "createdAt", user.getCreatedAt()
        );
    }

    private Map<String, Object> issueTokens(User user) {
        refreshTokenRepository.deleteByUser(user);
        String refreshTokenValue = jwtService.createRefreshToken(user.getId(), user.getEmail(), user.getRole());
        refreshTokenRepository.save(new RefreshToken(
                user,
                refreshTokenValue,
                LocalDateTime.now().plusSeconds(refreshTokenTtlSeconds),
                false
        ));

        return Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "accessToken", jwtService.createAccessToken(user.getId(), user.getEmail(), user.getRole()),
                "refreshToken", refreshTokenValue
        );
    }
}
