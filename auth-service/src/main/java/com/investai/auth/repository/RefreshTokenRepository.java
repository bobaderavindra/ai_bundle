package com.investai.auth.repository;

import com.investai.auth.model.RefreshToken;
import com.investai.auth.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);

    long deleteByUser(User user);
}
