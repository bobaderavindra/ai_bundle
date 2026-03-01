package com.investai.portfolio.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Portfolio {
    private final String id;
    private final String ownerEmail;
    private final String name;
    private final List<Holding> holdings;

    public Portfolio(String ownerEmail, String name) {
        this.id = UUID.randomUUID().toString();
        this.ownerEmail = ownerEmail;
        this.name = name;
        this.holdings = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public String getName() {
        return name;
    }

    public List<Holding> getHoldings() {
        return holdings;
    }
}
