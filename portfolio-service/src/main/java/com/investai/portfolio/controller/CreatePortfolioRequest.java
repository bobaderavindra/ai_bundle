package com.investai.portfolio.controller;

import jakarta.validation.constraints.NotBlank;

public record CreatePortfolioRequest(@NotBlank String name) {
}
