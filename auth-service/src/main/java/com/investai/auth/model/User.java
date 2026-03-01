package com.investai.auth.model;

public record User(String email, String fullName, String passwordHash) {
}
