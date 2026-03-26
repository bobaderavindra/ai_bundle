package com.investai.portfolio.controller;

import jakarta.validation.constraints.NotBlank;

public record UpdatePortfolioRequest(@NotBlank String portfolioId, @NotBlank String name) {
}
