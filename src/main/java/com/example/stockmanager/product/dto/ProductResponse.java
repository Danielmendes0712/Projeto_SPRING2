package com.example.stockmanager.product.dto;

import java.time.Instant;

public record ProductResponse(
        Long id,
        String description,
        int quantity,
        boolean deleted,
        Instant deletedAt,
        Instant createdAt,
        Instant updatedAt
) {}
