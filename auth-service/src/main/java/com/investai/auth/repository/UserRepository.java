package com.investai.auth.repository;

import com.investai.auth.model.User;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final Map<String, User> users = new ConcurrentHashMap<>();

    public Optional<User> findByEmail(String email) {
        return Optional.ofNullable(users.get(email.toLowerCase()));
    }

    public User save(User user) {
        users.put(user.email().toLowerCase(), user);
        return user;
    }
}
